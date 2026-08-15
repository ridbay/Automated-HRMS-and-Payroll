import { Hono } from 'hono';
import {
  getMyProfile,
  updateMyProfile,
  addEmergencyContact,
  deleteEmergencyContact,
  uploadDocument,
  deleteDocument,
  downloadDocument,
  getDirectory,
  getMyDirectReports
} from '../controllers/employee/profile.controller';
import { getMyLeaveData, applyForLeave, getTeamLeaves, getMyTeamPendingLeaves, updateTeamLeaveStatus } from '../controllers/employee/leave.controller';
import {
  getAttendanceData,
  clockIn,
  clockOut,
  getOvertimeRequests,
  submitOvertimeRequest,
  getMyTeamAttendanceToday,
  getMyTeamPendingOvertime,
  updateTeamOvertimeStatus
} from '../controllers/employee/attendance.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getMyCompensation } from '../controllers/employee/compensation.controller';
import { getMyPayslips } from '../controllers/employee/payslip.controller';
import { sendShoutout, getShoutouts } from '../controllers/employee/feedback.controller';
import { getMyGoals, createGoal, updateGoalProgress, getTeamGoals, assignTeamGoal, getCompanyObjectives } from '../controllers/employee/goal.controller';
import {
  getMyAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  submitAssessment,
  getActiveCycleAssessment,
  getTeamPendingAssessments,
  getTeamAnalytics,
  submitManagerReview
} from '../controllers/employee/assessment.controller';
import { getMyPerformanceSummary } from '../controllers/employee/performanceSummary.controller';
import { getTeamReport } from '../controllers/admin/reports.controller';
import benefitsEmployeeRoutes from './benefits-employee.routes';

const employeeRoutes = new Hono();

employeeRoutes.use('*', authMiddleware);

// Directory
employeeRoutes.get('/directory', getDirectory);

// Manager-scoped: the caller's own direct reports (id/name/avatar/role/dept
// only) — used by team goal & review UIs. Naturally self-scoped by
// employeeId, same convention as leave/attendance team routes below.
employeeRoutes.get('/team/members', getMyDirectReports);

// Self-Service Profile Routes
employeeRoutes.get('/me', getMyProfile);
employeeRoutes.get('/me/compensation', getMyCompensation);
employeeRoutes.get('/me/payslips', getMyPayslips);
employeeRoutes.put('/me', updateMyProfile);
employeeRoutes.post('/me/emergency-contacts', addEmergencyContact);
employeeRoutes.delete('/me/emergency-contacts/:id', deleteEmergencyContact);

// Document Management
employeeRoutes.post('/me/documents', uploadDocument);
employeeRoutes.delete('/me/documents/:id', deleteDocument);
employeeRoutes.get('/me/documents/:id/download', downloadDocument);

// Self-Service Leave Routes
employeeRoutes.get('/leave/me', getMyLeaveData);
employeeRoutes.post('/leave/apply', applyForLeave);
employeeRoutes.get('/leave/team', getTeamLeaves);

// Manager-scoped: pending leave requests for the caller's direct reports.
// Naturally self-scoped by employeeId — no separate role gate needed here.
employeeRoutes.get('/leave/team-requests', getMyTeamPendingLeaves);
employeeRoutes.patch('/leave/team-requests/:id/status', updateTeamLeaveStatus);

// Self-Service Attendance Routes
employeeRoutes.get('/attendance/me', getAttendanceData);
employeeRoutes.post('/attendance/clock-in', clockIn);
employeeRoutes.post('/attendance/clock-out', clockOut);
employeeRoutes.get('/attendance/overtime', getOvertimeRequests);
employeeRoutes.post('/attendance/overtime', submitOvertimeRequest);

// Manager-scoped: team presence & overtime approvals for the caller's direct reports.
// Naturally self-scoped by employeeId — no separate role gate needed here.
employeeRoutes.get('/attendance/team', getMyTeamAttendanceToday);
employeeRoutes.get('/attendance/team-requests', getMyTeamPendingOvertime);
employeeRoutes.patch('/attendance/team-requests/:id/status', updateTeamOvertimeStatus);

// Feedback / Shoutouts
employeeRoutes.post('/feedback', sendShoutout);
employeeRoutes.get('/feedback', getShoutouts);

// Goals / OKRs
employeeRoutes.get('/goals', getMyGoals);
// Read-only company/department objectives, for alignment context — must be
// registered ahead of the `:id`-shaped routes below.
employeeRoutes.get('/goals/company', getCompanyObjectives);
employeeRoutes.post('/goals', createGoal);
employeeRoutes.patch('/goals/:id', updateGoalProgress);

// Manager-scoped: direct reports' goals, and assigning a goal to one of them.
// Naturally self-scoped by employeeId — no separate role gate needed here.
employeeRoutes.get('/goals/team', getTeamGoals);
employeeRoutes.post('/goals/team', assignTeamGoal);

// Personal performance dashboard stats.
employeeRoutes.get('/performance/summary', getMyPerformanceSummary);

// Manager-scoped: Reports & Analytics for the caller's direct reports.
// Naturally self-scoped by employeeId — no separate role gate needed here.
employeeRoutes.get('/reports/team', getTeamReport);

// Assessments / Self-Reviews
employeeRoutes.get('/assessments', getMyAssessments);
employeeRoutes.get('/assessments/active', getActiveCycleAssessment);
// Manager-scoped: direct reports' self-assessments awaiting a manager
// rating. SUPER_ADMIN/HR_ADMIN may also review (or override) anyone's —
// enforced inside the service, not the route. Registered ahead of the
// `:id` route below so "team-pending" isn't swallowed as an id.
employeeRoutes.get('/assessments/team-pending', getTeamPendingAssessments);
employeeRoutes.get('/assessments/team-analytics', getTeamAnalytics);
employeeRoutes.get('/assessments/:id', getAssessment);
employeeRoutes.post('/assessments', createAssessment);
employeeRoutes.put('/assessments/:id', updateAssessment);
employeeRoutes.post('/assessments/:id/submit', submitAssessment);
employeeRoutes.post('/assessments/:id/manager-review', submitManagerReview);

// Benefits & Wellbeing self-service (plan enrollment, dependents, wellness
// programs, claims) — all scoped to the caller via the JWT employeeId.
employeeRoutes.route('/benefits', benefitsEmployeeRoutes);

export default employeeRoutes;
