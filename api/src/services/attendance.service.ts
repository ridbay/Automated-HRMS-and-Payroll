import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';

export class AttendanceService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async getEmployeeAttendance(companyId: string, employeeId: string) {
    return this.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.employeeId, employeeId)
      ),
      orderBy: (attendanceRecords: any, { desc }: any) => [desc(attendanceRecords.date)]
    });
  }

  async getTodayAttendance(companyId: string, employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const records = await this.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.employeeId, employeeId),
        eq(schema.attendanceRecords.date, today)
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
    const today = new Date().toISOString().split('T')[0];
    const clockOutTime = new Date().toISOString();

    const currentRecord = await this.getTodayAttendance(companyId, employeeId);
    if (!currentRecord) throw new Error('No clock in record found for today');

    // Calculate basic work hours
    const clockInDate = new Date(currentRecord.clockIn);
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
        eq(schema.attendanceRecords.companyId, companyId),
        eq(schema.attendanceRecords.employeeId, employeeId),
        eq(schema.attendanceRecords.date, today)
      ))
      .returning();

    return result[0];
  }
}
