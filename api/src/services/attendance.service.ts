import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, isNull } from 'drizzle-orm';
import * as schema from '../db/schema';

export class AttendanceService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

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
        grouped[r.date] = { date: r.date, status: r.status, clockIn: r.clockIn, clockOut: r.clockOut, workHours: 0, note: r.notes };
      }
      grouped[r.date].workHours += (r.workHours || 0);
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

  async clockIn(companyId: string, employeeId: string, data: any) {
    const today = new Date().toISOString().split('T')[0];
    const clockInTime = new Date().toISOString();
    const id = `ATT-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await this.db.insert(schema.attendanceRecords).values({
      id,
      companyId,
      employeeId,
      date: today,
      clockIn: clockInTime,
      status: 'present',
      locationIn: data.location,
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

    const result = await this.db.update(schema.attendanceRecords)
      .set({
        clockOut: clockOutTime,
        locationOut: data.location,
        workHours,
      })
      .where(and(
        eq(schema.attendanceRecords.id, activeSession.id)
      ))
      .returning();

    return result[0];
  }
}
