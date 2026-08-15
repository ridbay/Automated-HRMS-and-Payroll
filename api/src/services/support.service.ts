import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { supportTickets, supportTicketMessages, employees } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

// Cloudflare Workers expose Web Crypto as a global — no Node "crypto" import
// (which needs nodejs_compat + a newer compatibility_date to resolve) needed.
const randomUUID = () => crypto.randomUUID();

export class SupportService {
  private db;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async getTickets(companyId: string, employeeId?: string, isAdmin = false) {
    let query = this.db.select({
      id: supportTickets.id,
      companyId: supportTickets.companyId,
      employeeId: supportTickets.employeeId,
      employeeName: employees.name,
      employeeAvatar: employees.avatar,
      subject: supportTickets.subject,
      description: supportTickets.description,
      category: supportTickets.category,
      priority: supportTickets.priority,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .leftJoin(employees, eq(supportTickets.employeeId, employees.id));

    if (isAdmin) {
      query.where(eq(supportTickets.companyId, companyId)).orderBy(desc(supportTickets.createdAt));
    } else if (employeeId) {
      query.where(and(eq(supportTickets.companyId, companyId), eq(supportTickets.employeeId, employeeId))).orderBy(desc(supportTickets.createdAt));
    } else {
      return [];
    }

    // Must await the result here because `.where` modifies and returns the query builder
    return await query;
  }

  async createTicket(companyId: string, employeeId: string, data: any) {
    const newTicket = {
      id: `ticket-${randomUUID()}`,
      companyId,
      employeeId,
      subject: data.subject,
      description: data.description,
      category: data.category || 'General',
      priority: data.priority || 'Low',
      status: 'Open',
    };

    await this.db.insert(supportTickets).values(newTicket);
    return newTicket;
  }

  async updateTicketStatus(companyId: string, ticketId: string, status: string) {
    const result = await this.db.update(supportTickets)
      .set({ status })
      .where(and(eq(supportTickets.id, ticketId), eq(supportTickets.companyId, companyId)))
      .returning();
    
    return result[0];
  }

  async getTicketMessages(ticketId: string) {
    return await this.db.select({
      id: supportTicketMessages.id,
      ticketId: supportTicketMessages.ticketId,
      senderId: supportTicketMessages.senderId,
      senderName: employees.name,
      senderAvatar: employees.avatar,
      message: supportTicketMessages.message,
      createdAt: supportTicketMessages.createdAt,
    })
    .from(supportTicketMessages)
    .leftJoin(employees, eq(supportTicketMessages.senderId, employees.id))
    .where(eq(supportTicketMessages.ticketId, ticketId))
    .orderBy(supportTicketMessages.createdAt);
  }

  async addTicketMessage(ticketId: string, senderId: string, message: string) {
    const newMessage = {
      id: `msg-${randomUUID()}`,
      ticketId,
      senderId,
      message,
    };
    await this.db.insert(supportTicketMessages).values(newMessage);
    return newMessage;
  }
}
