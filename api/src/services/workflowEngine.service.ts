import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { Bindings } from '../types';
import { MailgunService } from './mailgun.service';
import { NotificationService } from './controlCenter.service';
import { AuditService } from './audit.service';

const genId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

export interface WorkflowStep {
  id: string;
  name: string;
  assignee: string;
  actionType?: 'email' | 'notification' | 'task' | 'audit';
  actionConfig?: Record<string, any>;
  isAutomated?: boolean;
}

export interface TriggerWorkflowPayload {
  companyId: string;
  workflowKey: 'onboarding' | 'offboarding' | 'leave_approvals' | 'payroll_locking' | string;
  triggerEvent: string;
  entityId?: string;
  actorId?: string;
  data?: Record<string, any>;
}

export interface ActionLogItem {
  stepId: string;
  name: string;
  actionType: string;
  status: 'executed' | 'assigned' | 'failed';
  detail?: string;
}

export interface WorkflowExecutionSummary {
  executionId: string;
  workflowKey: string;
  status: 'completed' | 'skipped' | 'failed';
  executedSteps: number;
  actionsRun: ActionLogItem[];
  error?: string;
}

export class WorkflowEngineService {
  private db;

  constructor(private dbBinding: D1Database, private env?: Bindings) {
    this.db = drizzle(dbBinding, { schema });
  }

  /**
   * Executes a workflow automation pipeline triggered by a business event.
   */
  async trigger(payload: TriggerWorkflowPayload): Promise<WorkflowExecutionSummary> {
    const { companyId, workflowKey, triggerEvent, entityId, actorId, data = {} } = payload;
    const executionId = genId('wfexec');
    const actionsRun: ActionLogItem[] = [];

    try {
      // Find the workflow definition
      const workflow = await this.db.query.workflows.findFirst({
        where: and(eq(schema.workflows.companyId, companyId), eq(schema.workflows.key, workflowKey)),
      });

      if (!workflow || !workflow.enabled) {
        // Record skipped execution
        try {
          await this.db.insert(schema.workflowExecutions).values({
            id: executionId,
            companyId,
            workflowKey,
            triggerEvent,
            entityId: entityId || null,
            status: 'skipped',
            details: { reason: workflow ? 'Workflow is disabled' : 'Workflow not configured' },
          });
        } catch {
          // Non-blocking log failure
        }

        return {
          executionId,
          workflowKey,
          status: 'skipped',
          executedSteps: 0,
          actionsRun: [],
        };
      }

      const steps: WorkflowStep[] = Array.isArray(workflow.steps) ? (workflow.steps as WorkflowStep[]) : [];

      const mailgun = new MailgunService(this.dbBinding, this.env);
      const notifications = new NotificationService(this.dbBinding);
      const audit = new AuditService(this.dbBinding);

      for (const step of steps) {
        const actionType = step.actionType || (step.assignee === 'System' ? 'notification' : 'task');

        try {
          if (actionType === 'email' && data.email) {
            const templateKey = step.actionConfig?.templateKey || `${workflowKey}_step`;
            await mailgun.sendEmail({
              companyId,
              to: data.email,
              templateKey,
              variables: data,
              subject: step.name,
              eventType: `workflow.${workflowKey}.${step.id}`,
            });
            actionsRun.push({ stepId: step.id, name: step.name, actionType: 'email', status: 'executed', detail: `Sent to ${data.email}` });
          } else if (actionType === 'notification') {
            const msg = `⚡ Workflow *${workflow.name}*: Step "${step.name}" executed for ${data.employeeName || data.name || entityId || 'record'}.`;
            await notifications.notify(companyId, `workflow.${workflowKey}`, msg);
            actionsRun.push({ stepId: step.id, name: step.name, actionType: 'notification', status: 'executed', detail: 'Dispatched to team channel' });
          } else if (actionType === 'audit') {
            await audit.log(companyId, {
              actorId: actorId || 'system',
              subjectId: entityId,
              action: `Workflow step "${step.name}" completed`,
              module: 'workflows',
              details: JSON.stringify(data),
            });
            actionsRun.push({ stepId: step.id, name: step.name, actionType: 'audit', status: 'executed' });
          } else {
            // Task assigned to role/user
            actionsRun.push({
              stepId: step.id,
              name: step.name,
              actionType: 'task',
              status: 'assigned',
              detail: `Assigned to ${step.assignee}`,
            });
          }
        } catch (err: any) {
          actionsRun.push({
            stepId: step.id,
            name: step.name,
            actionType,
            status: 'failed',
            detail: err.message,
          });
        }
      }

      // Record successful execution
      await this.db.insert(schema.workflowExecutions).values({
        id: executionId,
        companyId,
        workflowKey,
        triggerEvent,
        entityId: entityId || null,
        status: 'completed',
        details: {
          stepsTotal: steps.length,
          actionsRun,
          triggerData: data,
        },
      });

      return {
        executionId,
        workflowKey,
        status: 'completed',
        executedSteps: actionsRun.length,
        actionsRun,
      };
    } catch (err: any) {
      try {
        await this.db.insert(schema.workflowExecutions).values({
          id: executionId,
          companyId,
          workflowKey,
          triggerEvent,
          entityId: entityId || null,
          status: 'failed',
          details: { error: err.message, actionsRun },
        });
      } catch {
        // Safe fallback
      }

      return {
        executionId,
        workflowKey,
        status: 'failed',
        executedSteps: actionsRun.length,
        actionsRun,
        error: err.message,
      };
    }
  }

  /**
   * Retrieves execution history for auditing automation pipelines.
   */
  async listExecutions(companyId: string, workflowKey?: string, limit = 20) {
    if (workflowKey) {
      return this.db.select().from(schema.workflowExecutions)
        .where(and(eq(schema.workflowExecutions.companyId, companyId), eq(schema.workflowExecutions.workflowKey, workflowKey)))
        .orderBy(desc(schema.workflowExecutions.createdAt))
        .limit(limit)
        .all();
    }

    return this.db.select().from(schema.workflowExecutions)
      .where(eq(schema.workflowExecutions.companyId, companyId))
      .orderBy(desc(schema.workflowExecutions.createdAt))
      .limit(limit)
      .all();
  }
}
