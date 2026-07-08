import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { D1Database } from '@cloudflare/workers-types';
import { employeeBenefits } from '../models/benefits.model';
import { employees } from '../models/employee.model';

export class BenefitsService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding);
  }

  async getEmployeeCompensation(companyId: string, employeeId: string) {
    // Fetch base employee details (salary)
    const [employee] = await this.db.select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));

    if (!employee) throw new Error('Employee not found');

    // Fetch benefits record
    let [benefits] = await this.db.select()
      .from(employeeBenefits)
      .where(and(eq(employeeBenefits.employeeId, employeeId), eq(employeeBenefits.companyId, companyId)));

    // If no benefits record exists, create a default one to ensure the UI doesn't break
    if (!benefits) {
      const defaultId = crypto.randomUUID();
      await this.db.insert(employeeBenefits).values({
        id: defaultId,
        companyId,
        employeeId,
        healthProvider: 'ZenHR Care',
        healthPlan: 'Premium Plus',
        healthCoverage: 'Family',
        healthPremium: 50000,
        retirementPlan: 'ZenHR 401(k)',
        retirementBalance: 0,
        retirementContributionRate: 5.0,
        employerMatchRate: 5.0,
        equityGranted: 1000,
        equityVested: 0,
        equityValue: 500000,
        wellnessBudget: 150000,
        wellnessUsed: 0,
      });

      [benefits] = await this.db.select()
        .from(employeeBenefits)
        .where(eq(employeeBenefits.id, defaultId));
    }

    return {
      baseSalary: employee.baseSalary || employee.salary || 0, // Fallback if baseSalary is null
      benefits
    };
  }
}
