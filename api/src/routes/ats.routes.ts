import { Hono } from 'hono';
import {
  listCandidates,
  getCandidate,
  createCandidate,
  updateCandidateStatus,
  rateCandidate,
  sendCandidateMessage,
  getCandidateResume,
  listInterviews,
  scheduleInterview,
  updateInterviewStatus,
  submitScorecard,
  listOffers,
  createOffer,
  sendOffer,
  respondToOffer,
  rescindOffer,
} from '../controllers/admin/ats.controller';
import { requireRole } from '../middlewares/role.middleware';

export const atsRoutes = new Hono();

// Same role model as job requisitions (requisition.routes.ts): anyone with
// recruitment visibility can browse; only recruiting staff can mutate the
// pipeline; offer approval/send stays with HR/Super Admin.
const viewers = requireRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'RECRUITER');
const mutators = requireRole('SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER');
const approvers = requireRole('SUPER_ADMIN', 'HR_ADMIN');

// Candidates
atsRoutes.get('/candidates', viewers, listCandidates);
atsRoutes.get('/candidates/:id', viewers, getCandidate);
atsRoutes.get('/candidates/:id/resume', viewers, getCandidateResume);
atsRoutes.post('/candidates', mutators, createCandidate);
atsRoutes.patch('/candidates/:id/status', mutators, updateCandidateStatus);
atsRoutes.patch('/candidates/:id/rating', mutators, rateCandidate);
atsRoutes.post('/candidates/:id/message', mutators, sendCandidateMessage);

// Interviews
atsRoutes.get('/interviews', viewers, listInterviews);
atsRoutes.post('/interviews', mutators, scheduleInterview);
atsRoutes.patch('/interviews/:id/status', mutators, updateInterviewStatus);
// Any viewer (incl. a manager sitting on a panel) can submit their own scorecard.
atsRoutes.post('/interviews/:id/scorecard', viewers, submitScorecard);

// Offers
atsRoutes.get('/offers', viewers, listOffers);
atsRoutes.post('/offers', mutators, createOffer);
atsRoutes.post('/offers/:id/send', approvers, sendOffer);
atsRoutes.post('/offers/:id/respond', mutators, respondToOffer);
atsRoutes.post('/offers/:id/rescind', approvers, rescindOffer);

export default atsRoutes;
