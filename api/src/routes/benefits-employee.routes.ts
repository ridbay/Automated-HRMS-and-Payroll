import { Hono } from 'hono';
import {
  getMySummary,
  listAvailablePlans,
  listMyEnrollments,
  enrollInPlan,
  cancelMyEnrollment,
  listMyDependents,
  addMyDependent,
  deleteMyDependent,
  listWellnessPrograms,
  joinWellnessProgram,
  updateMyProgramProgress,
  leaveWellnessProgram,
  listMyClaims,
  submitMyClaim,
} from '../controllers/employee/benefits.controller';

const benefitsEmployeeRoutes = new Hono();

benefitsEmployeeRoutes.get('/me/summary', getMySummary);

benefitsEmployeeRoutes.get('/plans', listAvailablePlans);

benefitsEmployeeRoutes.get('/enrollments', listMyEnrollments);
benefitsEmployeeRoutes.post('/enrollments', enrollInPlan);
benefitsEmployeeRoutes.patch('/enrollments/:id/cancel', cancelMyEnrollment);

benefitsEmployeeRoutes.get('/dependents', listMyDependents);
benefitsEmployeeRoutes.post('/dependents', addMyDependent);
benefitsEmployeeRoutes.delete('/dependents/:id', deleteMyDependent);

benefitsEmployeeRoutes.get('/wellness/programs', listWellnessPrograms);
benefitsEmployeeRoutes.post('/wellness/programs/:id/join', joinWellnessProgram);
benefitsEmployeeRoutes.patch('/wellness/programs/:id/progress', updateMyProgramProgress);
benefitsEmployeeRoutes.post('/wellness/programs/:id/leave', leaveWellnessProgram);

benefitsEmployeeRoutes.get('/claims', listMyClaims);
benefitsEmployeeRoutes.post('/claims', submitMyClaim);

export default benefitsEmployeeRoutes;
