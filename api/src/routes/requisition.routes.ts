import { Hono } from 'hono';
import {
  getAllRequisitions,
  getPendingRequisitions,
  getMyRequisitions,
  createRequisition,
  approveRequisition,
  rejectRequisition,
  updateRequisitionStatus,
  deleteRequisition,
} from '../controllers/admin/requisition.controller';
import { requireRole } from '../middlewares/role.middleware';

export const requisitionRoutes = new Hono();

// Anyone with recruitment visibility can browse requisitions.
const viewers = requireRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'RECRUITER');
// Managers can raise a headcount request; HR Admin/Super Admin can open one directly.
const requesters = requireRole('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER');
// Only HR Admin/Super Admin approve, reject, or otherwise manage a requisition's lifecycle.
const approvers = requireRole('SUPER_ADMIN', 'HR_ADMIN');

requisitionRoutes.get('/', viewers, getAllRequisitions);
requisitionRoutes.get('/pending', approvers, getPendingRequisitions);
requisitionRoutes.get('/mine', requesters, getMyRequisitions);
requisitionRoutes.post('/', requesters, createRequisition);
requisitionRoutes.patch('/:id/approve', approvers, approveRequisition);
requisitionRoutes.patch('/:id/reject', approvers, rejectRequisition);
requisitionRoutes.patch('/:id/status', approvers, updateRequisitionStatus);
requisitionRoutes.delete('/:id', approvers, deleteRequisition);

export default requisitionRoutes;
