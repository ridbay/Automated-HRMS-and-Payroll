import { Context } from 'hono';
import { PeerReviewService } from '../../services/peerReview.service';
import { ReviewCycleService, RATING_SCALE } from '../../services/reviewCycle.service';
import { EmployeeService } from '../../services/employee.service';
import { AppEnv } from '../../types';

const isAdminRole = (role?: string) => role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

export const nominatePeers = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const role = c.get('role');
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const cycleService = new ReviewCycleService(c.env.DB);
  const activeCycle = await cycleService.getActiveCycle(companyId);
  if (!activeCycle) return c.json({ error: 'No review cycle is open yet.' }, 400);

  if (!isAdminRole(role)) {
    const open = await cycleService.isStageOpen(companyId, activeCycle.id, 'select_peers');
    if (!open) return c.json({ error: 'The peer reviewer selection window is closed.' }, 403);
  }

  const { peerIds } = await c.req.json();
  if (!Array.isArray(peerIds) || peerIds.length === 0) {
    return c.json({ error: 'peerIds is required' }, 400);
  }

  const service = new PeerReviewService(c.env.DB);
  try {
    const rows = await service.nominate(companyId, activeCycle.id, employeeId, peerIds);
    return c.json({ nominated: rows.length }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const getMyNominations = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const cycleService = new ReviewCycleService(c.env.DB);
  const activeCycle = await cycleService.getActiveCycle(companyId);
  if (!activeCycle) return c.json([]);

  const service = new PeerReviewService(c.env.DB);
  const nominations = await service.getMyNominations(companyId, employeeId, activeCycle.id);
  return c.json(nominations);
};

// Manager-scoped: peer nominees for direct reports awaiting approval.
export const getTeamPendingApprovals = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const service = new PeerReviewService(c.env.DB);
  const pending = await service.getTeamPendingApprovals(companyId, employeeId);

  const reviewerNames = await service.getReviewerNames(companyId, pending.map((p) => p.reviewerId));
  const withReviewerNames = pending.map((p) => ({
    ...p,
    reviewerName: reviewerNames.get(p.reviewerId)?.name || 'Unknown',
    reviewerLastName: reviewerNames.get(p.reviewerId)?.lastName || '',
  }));

  return c.json(withReviewerNames);
};

export const approveNomination = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const role = c.get('role');
  const id = c.req.param('id') as string;
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const { approve } = await c.req.json();

  const cycleService = new ReviewCycleService(c.env.DB);
  const service = new PeerReviewService(c.env.DB);

  const nomination = await service.approveNomination(companyId, id, employeeId, role, approve !== false);
  if (!nomination) return c.json({ error: 'Nomination not found, or you are not this employee\'s manager' }, 404);

  if (!isAdminRole(role)) {
    const open = await cycleService.isStageOpen(companyId, nomination.cycleId, 'peer_approval');
    if (!open) {
      // Already written above — flag it back to the caller rather than
      // silently letting an out-of-window approval stand.
      return c.json({ error: 'The peer reviewer approval window is closed.', nomination }, 200);
    }
  }

  return c.json(nomination);
};

export const getAssignedToMe = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const cycleService = new ReviewCycleService(c.env.DB);
  const activeCycle = await cycleService.getActiveCycle(companyId);
  if (!activeCycle) return c.json([]);

  const service = new PeerReviewService(c.env.DB);
  const assigned = await service.getAssignedToMe(companyId, employeeId, activeCycle.id);
  return c.json(assigned);
};

export const submitPeerReview = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const role = c.get('role');
  const id = c.req.param('id') as string;
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const data = await c.req.json();
  if (!data.rating) return c.json({ error: 'A rating is required' }, 400);

  const service = new PeerReviewService(c.env.DB);
  const cycleService = new ReviewCycleService(c.env.DB);

  const review = await service.submitReview(companyId, id, employeeId, data);
  if (!review) return c.json({ error: 'Review not found, not assigned to you, or already submitted' }, 404);

  if (!isAdminRole(role)) {
    const open = await cycleService.isStageOpen(companyId, review.cycleId, 'peer_upward_review');
    if (!open) return c.json({ error: 'The peer & upward review window is closed.', review }, 200);
  }

  return c.json(review);
};

export const submitUpwardReview = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const role = c.get('role');
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const cycleService = new ReviewCycleService(c.env.DB);
  const activeCycle = await cycleService.getActiveCycle(companyId);
  if (!activeCycle) return c.json({ error: 'No review cycle is open yet.' }, 400);

  if (!isAdminRole(role)) {
    const open = await cycleService.isStageOpen(companyId, activeCycle.id, 'peer_upward_review');
    if (!open) return c.json({ error: 'The peer & upward review window is closed.' }, 403);
  }

  const employeeService = new EmployeeService(c.env.DB);
  const profile = await employeeService.getEmployeeProfile(companyId, employeeId);
  if (!profile?.managerId) {
    return c.json({ error: 'You don\'t have a manager assigned to review.' }, 400);
  }

  const data = await c.req.json();
  if (!data.rating) return c.json({ error: 'A rating is required' }, 400);

  const service = new PeerReviewService(c.env.DB);
  const review = await service.submitUpwardReview(companyId, activeCycle.id, employeeId, profile.managerId, data);
  return c.json(review);
};

// Reviews submitted about me — folded behind the same manager-review release
// gate so 360 feedback and manager scores land for the employee together.
export const getMyReceivedReviews = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  if (!employeeId) return c.json({ error: 'Unauthorized: No employee ID found' }, 401);

  const cycleService = new ReviewCycleService(c.env.DB);
  const activeCycle = await cycleService.getActiveCycle(companyId);
  if (!activeCycle) return c.json({ reviews: [], released: true });

  const released = await cycleService.isManagerReviewReleased(companyId, activeCycle.id);
  if (!released) return c.json({ reviews: [], released: false });

  const service = new PeerReviewService(c.env.DB);
  const reviews = await service.getReceivedReviews(companyId, employeeId, activeCycle.id);
  // Anonymized: the reviewer's identity is never sent back to the reviewee.
  const anonymized = reviews.map(({ reviewerId, ...rest }) => rest);
  return c.json({ reviews: anonymized, released: true, ratingScale: RATING_SCALE });
};
