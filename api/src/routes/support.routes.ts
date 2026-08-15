import { Hono } from 'hono';
import { getTickets, createTicket, updateTicketStatus, getTicketMessages, addTicketMessage } from '../controllers/support.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { AppEnv } from '../types';

const router = new Hono<AppEnv>();

router.use('/*', authMiddleware);

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.put('/tickets/:id/status', updateTicketStatus);

router.get('/tickets/:id/messages', getTicketMessages);
router.post('/tickets/:id/messages', addTicketMessage);

export default router;
