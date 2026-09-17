import { Context } from 'hono';
import { SupportService } from '../services/support.service';
import { AppEnv } from '../types';

export const getTickets = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');
  const role = c.get('role');

  if (!companyId) return c.json({ error: 'Unauthorized' }, 401);

  const isAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  const service = new SupportService(c.env.DB);
  
  const tickets = await service.getTickets(companyId, employeeId, isAdmin);
  return c.json(tickets);
};

export const createTicket = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const employeeId = c.get('employeeId');

  if (!companyId || !employeeId) return c.json({ error: 'Unauthorized' }, 401);

  const data = await c.req.json();
  const service = new SupportService(c.env.DB);
  const ticket = await service.createTicket(companyId, employeeId, data);
  return c.json(ticket);
};

export const updateTicketStatus = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const role = c.get('role');
  const ticketId = c.req.param('id');

  if (!companyId) return c.json({ error: 'Unauthorized' }, 401);

  // Allow only admins to update the status of tickets
  const isAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  if (!isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  if (!ticketId) return c.json({ error: 'Ticket ID is required' }, 400);

  const { status } = await c.req.json();
  const service = new SupportService(c.env.DB);
  const ticket = await service.updateTicketStatus(companyId, ticketId, status);
  return c.json(ticket);
};

export const getTicketMessages = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const ticketId = c.req.param('id');

  if (!companyId) return c.json({ error: 'Unauthorized' }, 401);
  if (!ticketId) return c.json({ error: 'Ticket ID is required' }, 400);

  const service = new SupportService(c.env.DB);
  const messages = await service.getTicketMessages(ticketId);
  return c.json(messages);
};

export const addTicketMessage = async (c: Context<AppEnv>) => {
  const companyId = c.get('companyId');
  const senderId = c.get('employeeId');
  const ticketId = c.req.param('id');

  if (!companyId || !senderId) return c.json({ error: 'Unauthorized' }, 401);
  if (!ticketId) return c.json({ error: 'Ticket ID is required' }, 400);

  const { message } = await c.req.json();
  const service = new SupportService(c.env.DB);
  const newMessage = await service.addTicketMessage(ticketId, senderId, message);
  return c.json(newMessage);
};
