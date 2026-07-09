import { Hono } from 'hono';
import {
  getMyProfile,
  updateMyProfile,
  addEmergencyContact,
  deleteEmergencyContact,
  uploadDocument,
  deleteDocument,
  downloadDocument,
  getDirectory
} from '../controllers/employee/profile.controller';
import { getMyLeaveData, applyForLeave, getTeamLeaves } from '../controllers/employee/leave.controller';
import { getAttendanceData, clockIn, clockOut, getOvertimeRequests, submitOvertimeRequest } from '../controllers/employee/attendance.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getMyCompensation } from '../controllers/employee/compensation.controller';
import { sendShoutout, getShoutouts } from '../controllers/employee/feedback.controller';
import { getMyGoals, createGoal, updateGoalProgress } from '../controllers/employee/goal.controller';
import {
  getMyAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  submitAssessment,
  getActiveCycleAssessment
} from '../controllers/employee/assessment.controller';

const employeeRoutes = new Hono();

employeeRoutes.use('*', authMiddleware);

// Directory
employeeRoutes.get('/directory', getDirectory);

// Self-Service Profile Routes
employeeRoutes.get('/me', getMyProfile);
employeeRoutes.get('/me/compensation', getMyCompensation);
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

// Self-Service Attendance Routes
employeeRoutes.get('/attendance/me', getAttendanceData);
employeeRoutes.post('/attendance/clock-in', clockIn);
employeeRoutes.post('/attendance/clock-out', clockOut);
employeeRoutes.get('/attendance/overtime', getOvertimeRequests);
employeeRoutes.post('/attendance/overtime', submitOvertimeRequest);

// Feedback / Shoutouts
employeeRoutes.post('/feedback', sendShoutout);
employeeRoutes.get('/feedback', getShoutouts);

// Goals / OKRs
employeeRoutes.get('/goals', getMyGoals);
employeeRoutes.post('/goals', createGoal);
employeeRoutes.patch('/goals/:id', updateGoalProgress);

// Assessments / Self-Reviews
employeeRoutes.get('/assessments', getMyAssessments);
employeeRoutes.get('/assessments/active', getActiveCycleAssessment);
employeeRoutes.get('/assessments/:id', getAssessment);
employeeRoutes.post('/assessments', createAssessment);
employeeRoutes.put('/assessments/:id', updateAssessment);
employeeRoutes.post('/assessments/:id/submit', submitAssessment);

export default employeeRoutes;
