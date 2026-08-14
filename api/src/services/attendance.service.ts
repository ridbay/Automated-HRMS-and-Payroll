import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, isNull, inArray, gte, lte } from 'drizzle-orm';
import * as schema from '../db/schema';

type AttendancePolicy = {
  attendanceStartTime: string;
  attendanceEndTime: string;
  attendanceGraceMinutes: number;
};

export class AttendanceService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  // ---------------------------------------------------------------------
  // Policy helpers — drive the on-time/late tag at clock-in and the
  // standard shift length used to compute overtime at clock-out.
  // ---------------------------------------------------------------------

  private timeStringToMinutes(t: string | undefined | null): number {
    const [h, m] = (t || '09:00').split(':').map((n) => parseInt(n, 10));
    return (h || 0) * 60 + (m || 0);
  }

  private computeAttendanceStatus(clockInDate: Date, policy: AttendancePolicy): string {
    const clockInMinutes = clockInDate.getHours() * 60 + clockInDate.getMinutes();
    const thresholdMinutes = this.timeStringToMinutes(policy.attendanceStartTime) + (policy.attendanceGraceMinutes || 0);
    return clockInMinutes > thresholdMinutes ? 'late' : 'present';
  }

  private shiftHours(policy: AttendancePolicy): number {
    const startMinutes = this.timeStringToMinutes(policy.attendanceStartTime);
    const endMinutes = this.timeStringToMinutes(policy.attendanceEndTime);
    const diff = endMinutes - startMinutes;
    return diff > 0 ? diff / 60 : 8; // Fallback to a standard 8h shift if misconfigured
  }

  async getAttendancePolicy(companyId: string): Promise<AttendancePolicy> {
    const settings = await this.db.query.companySettings.findFirst({
      where: eq(schema.companySettings.companyId, companyId),
    });
    return {
      attendanceStartTime: settings?.attendanceStartTime || '09:00',
      attendanceEndTime: settings?.attendanceEndTime || '17:00',
      attendanceGraceMinutes: settings?.attendanceGraceMinutes ?? 15,
    };
  }

  async updateAttendancePolicy(companyId: string, data: Partial<AttendancePolicy>) {
    const existing = await this.db.query.companySettings.findFirst({
      where: eq(schema.companySettings.companyId, companyId),
    });

    const payload: any = { updatedAt: new Date().toISOString() };
    if (data.attendanceStartTime !== undefined) payload.attendanceStartTime = data.attendanceStartTime;
    if (data.attendanceEndTime !== undefined) payload.attendanceEndTime = data.attendanceEndTime;
    if (data.attendanceGraceMinutes !== undefined) payload.attendanceGraceMinutes = data.attendanceGraceMinutes;

    if (existing) {
      const result = await this.db.update(schema.companySettings)
        .set(payload)
        .where(eq(schema.companySettings.companyId, companyId))
        .returning();
      return result[0];
    }

    const result = await this.db.insert(schema.companySettings)
      .values({ companyId, ...payload })
      .returning();
    return result[0];
  }

  // ---------------------------------------------------------------------
  // Self-service (existing)
  // ---------------------------------------------------------------------

  async getEmployeeAttendance(companyId: string, employeeId: string) {
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.employeeId, employeeId)
      ),
      orderBy: (attendanceRecords: any, { desc }: any) => [desc(attendanceRecords.date), desc(attendanceRecords.clockIn)]
    });

    // Group by date to provide unified history
    const grouped: Record<string, any> = {};
    for (const r of records) {
      if (!grouped[r.date]) {
        grouped[r.date] = { date: r.date, status: r.status, clockIn: r.clockIn, clockOut: r.clockOut, workHours: 0, overtime: 0, note: r.notes };
      }
      grouped[r.date].workHours += (r.workHours || 0);
      grouped[r.date].overtime += (r.overtime || 0);
      // clockOut is the latest clock out of the day
      if (r.clockOut && (!grouped[r.date].clockOut || new Date(r.clockOut) > new Date(grouped[r.date].clockOut))) {
        grouped[r.date].clockOut = r.clockOut;
      }
    }
    return Object.values(grouped);
  }

  async getTodaySessions(companyId: string, employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.employeeId, employeeId),
        eq(schema.attendanceRecords.date, today)
      ),
      orderBy: (attendanceRecords: any, { asc }: any) => [asc(attendanceRecords.clockIn)]
    });
  }

  async getActiveSession(companyId: string, employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.employeeId, employeeId),
        eq(schema.attendanceRecords.date, today),
        isNull(schema.attendanceRecords.clockOut)
      ),
      limit: 1
    });
    return records[0] || null;
  }

  async getOvertimeRequests(companyId: string, employeeId: string) {
    return this.db.query.overtimeRequests.findMany({
      where: and(
        eq(schema.overtimeRequests.companyId, companyId),
        eq(schema.overtimeRequests.employeeId, employeeId)
      ),
      orderBy: (overtimeRequests: any, { desc }: any) => [desc(overtimeRequests.date), desc(overtimeRequests.createdAt)]
    });
  }

  async createOvertimeRequest(data: any) {
    const id = crypto.randomUUID();
    await this.db.insert(schema.overtimeRequests).values({
      id,
      companyId: data.companyId,
      employeeId: data.employeeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      hours: data.hours,
      reason: data.reason,
      deliverable: data.deliverable,
      status: "pending"
    });
    return { success: true, id };
  }

  async clockIn(companyId: string, employeeId: string, data: any) {
    const clockInDate = new Date();
    const today = clockInDate.toISOString().split('T')[0];
    const clockInTime = clockInDate.toISOString();
    const id = `ATT-${Math.floor(1000 + Math.random() * 9000)}`;

    const policy = await this.getAttendancePolicy(companyId);
    const status = this.computeAttendanceStatus(clockInDate, policy);

    const result = await this.db.insert(schema.attendanceRecords).values({
      id,
      companyId,
      employeeId,
      date: today,
      clockIn: clockInTime,
      status,
      locationIn: data.location,
      latitudeIn: data.latitude,
      longitudeIn: data.longitude,
      notes: data.notes,
      workHours: 0,
      overtime: 0,
    }).returning();

    return result[0];
  }

  async clockOut(companyId: string, employeeId: string, data: any) {
    const clockOutTime = new Date().toISOString();

    const activeSession = await this.getActiveSession(companyId, employeeId);
    if (!activeSession) throw new Error('No active clock in record found for today');

    // Calculate basic work hours
    const clockInDate = new Date(activeSession.clockIn);
    const clockOutDate = new Date(clockOutTime);
    const diffMs = Math.abs(clockOutDate.getTime() - clockInDate.getTime());
    const workHours = +(diffMs / (1000 * 60 * 60)).toFixed(2);

    const policy = await this.getAttendancePolicy(companyId);
    const overtime = +Math.max(0, workHours - this.shiftHours(policy)).toFixed(2);

    const result = await this.db.update(schema.attendanceRecords)
      .set({
        clockOut: clockOutTime,
        locationOut: data.location,
        latitudeOut: data.latitude,
        longitudeOut: data.longitude,
        workHours,
        overtime,
      })
      .where(eq(schema.attendanceRecords.id, activeSession.id))
      .returning();

    return result[0];
  }

  // ---------------------------------------------------------------------
  // Manager/company scoping helpers
  // ---------------------------------------------------------------------

  async getManagerTeamIds(companyId: string, managerId: string): Promise<string[]> {
    const reports = await this.db.query.employees.findMany({
      where: and(eq(schema.employees.companyId, companyId), eq(schema.employees.managerId, managerId)),
      columns: { id: true },
    });
    return reports.map((r: any) => r.id);
  }

  // ---------------------------------------------------------------------
  // Company-wide / team attendance oversight (Admin & Manager)
  // ---------------------------------------------------------------------

  async getCompanyAttendance(companyId: string, filters: { date?: string; from?: string; to?: string; employeeId?: string; managerId?: string } = {}) {
    const conditions = [eq(schema.attendanceRecords.companyId, companyId)];

    if (filters.managerId) {
      const teamIds = await this.getManagerTeamIds(companyId, filters.managerId);
      if (teamIds.length === 0) return [];
      conditions.push(inArray(schema.attendanceRecords.employeeId, teamIds));
    }
    if (filters.employeeId) conditions.push(eq(schema.attendanceRecords.employeeId, filters.employeeId));
    if (filters.date) {
      conditions.push(eq(schema.attendanceRecords.date, filters.date));
    } else {
      if (filters.from) conditions.push(gte(schema.attendanceRecords.date, filters.from));
      if (filters.to) conditions.push(lte(schema.attendanceRecords.date, filters.to));
    }

    return this.db
      .select({
        id: schema.attendanceRecords.id,
        employeeId: schema.attendanceRecords.employeeId,
        name: schema.employees.name,
        lastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        department: schema.employees.department,
        date: schema.attendanceRecords.date,
        clockIn: schema.attendanceRecords.clockIn,
        clockOut: schema.attendanceRecords.clockOut,
        status: schema.attendanceRecords.status,
        locationIn: schema.attendanceRecords.locationIn,
        locationOut: schema.attendanceRecords.locationOut,
        workHours: schema.attendanceRecords.workHours,
        overtime: schema.attendanceRecords.overtime,
        notes: schema.attendanceRecords.notes,
      })
      .from(schema.attendanceRecords)
      .innerJoin(schema.employees, eq(schema.attendanceRecords.employeeId, schema.employees.id))
      .where(and(...conditions))
      .orderBy(desc(schema.attendanceRecords.date), desc(schema.attendanceRecords.clockIn))
      .all();
  }

  async getAttendanceSummary(companyId: string, date: string, managerId?: string) {
    const employeeConditions = [eq(schema.employees.companyId, companyId), eq(schema.employees.status, 'active')];
    if (managerId) employeeConditions.push(eq(schema.employees.managerId, managerId));

    const scopedEmployees = await this.db.query.employees.findMany({
      where: and(...employeeConditions),
      columns: { id: true },
    });
    const scopedIds = scopedEmployees.map((e: any) => e.id);
    const totalEmployees = scopedIds.length;

    if (totalEmployees === 0) {
      return { date, totalEmployees: 0, present: 0, late: 0, absent: 0, onLeave: 0, stillClockedIn: 0, avgWorkHours: 0 };
    }

    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.date, date),
        inArray(schema.attendanceRecords.employeeId, scopedIds)
      ),
    });

    const presentIds = new Set(records.map((r: any) => r.employeeId));
    const lateIds = new Set(records.filter((r: any) => r.status === 'late').map((r: any) => r.employeeId));
    const stillClockedIn = records.filter((r: any) => !r.clockOut).length;

    const leaveRows = await this.db.query.leaveRequests.findMany({
      where: and(
        eq(schema.leaveRequests.companyId, companyId),
        eq(schema.leaveRequests.status, 'approved'),
        lte(schema.leaveRequests.startDate, date),
        gte(schema.leaveRequests.endDate, date),
        inArray(schema.leaveRequests.employeeId, scopedIds)
      ),
    });
    const onLeaveIds = new Set(
      leaveRows.map((r: any) => r.employeeId).filter((id: string) => !presentIds.has(id))
    );

    const absent = Math.max(0, totalEmployees - presentIds.size - onLeaveIds.size);
    const totalHours = records.reduce((sum: number, r: any) => sum + (r.workHours || 0), 0);
    const withHours = records.filter((r: any) => (r.workHours || 0) > 0).length;

    return {
      date,
      totalEmployees,
      present: presentIds.size,
      late: lateIds.size,
      absent,
      onLeave: onLeaveIds.size,
      stillClockedIn,
      avgWorkHours: withHours > 0 ? +(totalHours / withHours).toFixed(2) : 0,
    };
  }

  async getTeamAttendanceToday(companyId: string, managerId: string) {
    const team = await this.db.query.employees.findMany({
      where: and(eq(schema.employees.companyId, companyId), eq(schema.employees.managerId, managerId)),
      columns: { id: true, name: true, lastName: true, avatar: true, department: true, role: true },
    });
    if (team.length === 0) return [];

    const today = new Date().toISOString().split('T')[0];
    const teamIds = team.map((t: any) => t.id);
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.date, today),
        inArray(schema.attendanceRecords.employeeId, teamIds)
      ),
    });

    // Keep the latest session of the day per employee (handles multiple in/out cycles)
    const byEmployee: Record<string, any> = {};
    for (const r of records) {
      const existing = byEmployee[r.employeeId];
      if (!existing || new Date(r.clockIn) > new Date(existing.clockIn)) byEmployee[r.employeeId] = r;
    }

    return team.map((t: any) => {
      const record = byEmployee[t.id];
      return {
        employeeId: t.id,
        name: t.name,
        lastName: t.lastName,
        avatar: t.avatar,
        department: t.department,
        status: record ? (record.clockOut ? 'clocked-out' : record.status) : 'absent',
        clockIn: record?.clockIn || null,
        clockOut: record?.clockOut || null,
      };
    });
  }

  async createManualAttendanceRecord(companyId: string, data: any) {
    const id = `ATT-${Math.floor(1000 + Math.random() * 9000)}`;
    const date = data.date || new Date().toISOString().split('T')[0];
    const clockIn = data.clockIn || `${date}T00:00:00.000Z`;

    let workHours = data.workHours ?? 0;
    if (data.clockOut && data.workHours === undefined) {
      workHours = +(Math.abs(new Date(data.clockOut).getTime() - new Date(clockIn).getTime()) / (1000 * 60 * 60)).toFixed(2);
    }

    const result = await this.db.insert(schema.attendanceRecords).values({
      id,
      companyId,
      employeeId: data.employeeId,
      date,
      clockIn,
      clockOut: data.clockOut || null,
      status: data.status || 'present',
      locationIn: data.locationIn || 'Manual Entry (HR)',
      workHours,
      overtime: data.overtime ?? 0,
      notes: data.notes,
    }).returning();

    return result[0];
  }

  async updateAttendanceRecord(companyId: string, id: string, data: any) {
    const existing = await this.db.query.attendanceRecords.findFirst({
      where: and(eq(schema.attendanceRecords.id, id), eq(schema.attendanceRecords.companyId, companyId)),
    });
    if (!existing) return null;

    const updateData: any = {};
    if (data.clockIn !== undefined) updateData.clockIn = data.clockIn;
    if (data.clockOut !== undefined) updateData.clockOut = data.clockOut;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.locationIn !== undefined) updateData.locationIn = data.locationIn;
    if (data.locationOut !== undefined) updateData.locationOut = data.locationOut;

    const effectiveClockIn = updateData.clockIn ?? existing.clockIn;
    const effectiveClockOut = updateData.clockOut !== undefined ? updateData.clockOut : existing.clockOut;

    if (data.workHours !== undefined) {
      updateData.workHours = data.workHours;
    } else if (effectiveClockOut) {
      updateData.workHours = +(Math.abs(new Date(effectiveClockOut).getTime() - new Date(effectiveClockIn).getTime()) / (1000 * 60 * 60)).toFixed(2);
    }
    if (data.overtime !== undefined) updateData.overtime = data.overtime;

    const result = await this.db.update(schema.attendanceRecords)
      .set(updateData)
      .where(and(eq(schema.attendanceRecords.id, id), eq(schema.attendanceRecords.companyId, companyId)))
      .returning();

    return result[0];
  }

  async deleteAttendanceRecord(companyId: string, id: string) {
    const result = await this.db.delete(schema.attendanceRecords)
      .where(and(eq(schema.attendanceRecords.id, id), eq(schema.attendanceRecords.companyId, companyId)))
      .returning();
    return result[0] || null;
  }

  // ---------------------------------------------------------------------
  // Overtime oversight (Admin & Manager)
  // ---------------------------------------------------------------------

  async getAllOvertimeRequests(companyId: string, filters: { status?: string; managerId?: string } = {}) {
    const conditions = [eq(schema.overtimeRequests.companyId, companyId)];
    if (filters.status) conditions.push(eq(schema.overtimeRequests.status, filters.status));

    if (filters.managerId) {
      const teamIds = await this.getManagerTeamIds(companyId, filters.managerId);
      if (teamIds.length === 0) return [];
      conditions.push(inArray(schema.overtimeRequests.employeeId, teamIds));
    }

    return this.db
      .select({
        id: schema.overtimeRequests.id,
        employeeId: schema.overtimeRequests.employeeId,
        name: schema.employees.name,
        lastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        department: schema.employees.department,
        date: schema.overtimeRequests.date,
        startTime: schema.overtimeRequests.startTime,
        endTime: schema.overtimeRequests.endTime,
        hours: schema.overtimeRequests.hours,
        reason: schema.overtimeRequests.reason,
        deliverable: schema.overtimeRequests.deliverable,
        status: schema.overtimeRequests.status,
        managerComment: schema.overtimeRequests.managerComment,
        createdAt: schema.overtimeRequests.createdAt,
      })
      .from(schema.overtimeRequests)
      .innerJoin(schema.employees, eq(schema.overtimeRequests.employeeId, schema.employees.id))
      .where(and(...conditions))
      .orderBy(desc(schema.overtimeRequests.date), desc(schema.overtimeRequests.createdAt))
      .all();
  }

  async updateOvertimeRequestStatus(companyId: string, requestId: string, data: { status: string; managerComment?: string; managerId?: string; hours?: number }) {
    const updateData: any = {
      status: data.status,
      managerId: data.managerId,
      managerComment: data.managerComment,
    };
    if (data.hours !== undefined) updateData.hours = data.hours;

    const result = await this.db
      .update(schema.overtimeRequests)
      .set(updateData)
      .where(and(eq(schema.overtimeRequests.companyId, companyId), eq(schema.overtimeRequests.id, requestId)))
      .returning();

    return result[0];
  }

  async getPendingTeamOvertimeRequests(companyId: string, managerId: string) {
    // Pending requests from employees who report directly to this manager
    return this.db
      .select({
        id: schema.overtimeRequests.id,
        employeeId: schema.overtimeRequests.employeeId,
        name: schema.employees.name,
        lastName: schema.employees.lastName,
        avatar: schema.employees.avatar,
        date: schema.overtimeRequests.date,
        startTime: schema.overtimeRequests.startTime,
        endTime: schema.overtimeRequests.endTime,
        hours: schema.overtimeRequests.hours,
        reason: schema.overtimeRequests.reason,
        deliverable: schema.overtimeRequests.deliverable,
        status: schema.overtimeRequests.status,
      })
      .from(schema.overtimeRequests)
      .innerJoin(schema.employees, eq(schema.overtimeRequests.employeeId, schema.employees.id))
      .where(
        and(
          eq(schema.overtimeRequests.companyId, companyId),
          eq(schema.overtimeRequests.status, 'pending'),
          eq(schema.employees.managerId, managerId)
        )
      )
      .all();
  }

  async updateTeamOvertimeRequestStatus(companyId: string, managerId: string, requestId: string, data: { status: string; managerComment?: string; hours?: number }) {
    const request = await this.db.query.overtimeRequests.findFirst({
      where: and(eq(schema.overtimeRequests.id, requestId), eq(schema.overtimeRequests.companyId, companyId)),
    });
    if (!request) return null;

    const employee = await this.db.query.employees.findFirst({
      where: eq(schema.employees.id, request.employeeId),
    });

    // Only the requester's own manager may act on it — not just anyone with a MANAGER role
    if (!employee || employee.managerId !== managerId) return null;

    return this.updateOvertimeRequestStatus(companyId, requestId, {
      status: data.status,
      managerComment: data.managerComment,
      hours: data.hours,
      managerId,
    });
  }
}
