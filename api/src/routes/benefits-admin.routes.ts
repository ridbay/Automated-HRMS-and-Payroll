import { Hono } from 'hono';
import {
  getEmployeeBenefits,
  updateEmployeeBenefits,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listEnrollments,
  adminEnrollEmployee,
  adminUpdateEnrollmentStatus,
  listWellnessPrograms,
  createWellnessProgram,
  updateWellnessProgram,
  deleteWellnessProgram,
  listWellnessParticipants,
  listClaims,
  reviewClaim,
  getBenefitsOverview,
} from '../controllers/admin/benefits.controller';
import { requireRole } from '../middlewares/role.middleware';

const benefitsAdminRoutes = new Hono();

// Benefits has no matrix module (see admin.routes.ts's note on the "Benefits
// Admin" legacy routes) — stays gated on the fixed role only.
const adminOnly = requireRole('SUPER_ADMIN', 'HR_ADMIN');

benefitsAdminRoutes.get('/overview', adminOnly, getBenefitsOverview);

// Plan catalog
benefitsAdminRoutes.get('/plans', adminOnly, listPlans);
benefitsAdminRoutes.post('/plans', adminOnly, createPlan);
benefitsAdminRoutes.put('/plans/:id', adminOnly, updatePlan);
benefitsAdminRoutes.delete('/plans/:id', adminOnly, deletePlan);

// Enrollments
benefitsAdminRoutes.get('/enrollments', adminOnly, listEnrollments);
benefitsAdminRoutes.post('/enrollments', adminOnly, adminEnrollEmployee);
benefitsAdminRoutes.patch('/enrollments/:id/status', adminOnly, adminUpdateEnrollmentStatus);

// Wellness programs
benefitsAdminRoutes.get('/wellness/programs', adminOnly, listWellnessPrograms);
benefitsAdminRoutes.post('/wellness/programs', adminOnly, createWellnessProgram);
benefitsAdminRoutes.put('/wellness/programs/:id', adminOnly, updateWellnessProgram);
benefitsAdminRoutes.delete('/wellness/programs/:id', adminOnly, deleteWellnessProgram);
benefitsAdminRoutes.get('/wellness/programs/:id/participants', adminOnly, listWellnessParticipants);

// Claims review
benefitsAdminRoutes.get('/claims', adminOnly, listClaims);
benefitsAdminRoutes.patch('/claims/:id/review', adminOnly, reviewClaim);

// Legacy per-employee financial snapshot (EmployeeDetail.tsx "Benefits" tab)
benefitsAdminRoutes.get('/employee/:id', adminOnly, getEmployeeBenefits);
benefitsAdminRoutes.put('/employee/:id', adminOnly, updateEmployeeBenefits);

export default benefitsAdminRoutes;
