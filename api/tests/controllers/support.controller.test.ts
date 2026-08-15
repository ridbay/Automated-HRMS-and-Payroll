import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTickets, createTicket, updateTicketStatus, getTicketMessages, addTicketMessage } from '../../src/controllers/support.controller';
import { SupportService } from '../../src/services/support.service';

vi.mock('../../src/services/support.service');

describe('Support Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    SupportService.prototype.getTickets = vi.fn();
    SupportService.prototype.createTicket = vi.fn();
    SupportService.prototype.updateTicketStatus = vi.fn();
    SupportService.prototype.getTicketMessages = vi.fn();
    SupportService.prototype.addTicketMessage = vi.fn();

    mockContext = {
      req: {
        json: vi.fn(),
        param: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  describe('getTickets', () => {
    it('should return 401 if unauthorized', async () => {
      mockContext.get.mockReturnValue(null);
      const res = await getTickets(mockContext);
      expect(res.status).toBe(401);
    });

    it('should call getTickets with isAdmin true for HR_ADMIN', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'companyId') return 'comp-1';
        if (key === 'employeeId') return 'emp-1';
        if (key === 'role') return 'HR_ADMIN';
      });
      (SupportService.prototype.getTickets as any).mockResolvedValue([{ id: 'tic-1' }]);

      const res = await getTickets(mockContext);
      expect(SupportService.prototype.getTickets).toHaveBeenCalledWith('comp-1', 'emp-1', true);
      expect(mockContext.json).toHaveBeenCalledWith([{ id: 'tic-1' }]);
    });
  });

  describe('createTicket', () => {
    it('should return 401 if unauthorized', async () => {
      mockContext.get.mockReturnValue(null);
      const res = await createTicket(mockContext);
      expect(res.status).toBe(401);
    });

    it('should call createTicket on service', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'companyId') return 'comp-1';
        if (key === 'employeeId') return 'emp-1';
      });
      mockContext.req.json.mockResolvedValue({ subject: 'Help' });
      (SupportService.prototype.createTicket as any).mockResolvedValue({ id: 'tic-1' });

      await createTicket(mockContext);
      expect(SupportService.prototype.createTicket).toHaveBeenCalledWith('comp-1', 'emp-1', { subject: 'Help' });
    });
  });

  describe('updateTicketStatus', () => {
    it('should return 403 if not admin', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'companyId') return 'comp-1';
        if (key === 'role') return 'EMPLOYEE';
      });
      const res = await updateTicketStatus(mockContext);
      expect(res.status).toBe(403);
    });

    it('should update status if admin', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'companyId') return 'comp-1';
        if (key === 'role') return 'SUPER_ADMIN';
      });
      mockContext.req.param.mockReturnValue('tic-1');
      mockContext.req.json.mockResolvedValue({ status: 'closed' });
      (SupportService.prototype.updateTicketStatus as any).mockResolvedValue({ id: 'tic-1', status: 'closed' });

      await updateTicketStatus(mockContext);
      expect(SupportService.prototype.updateTicketStatus).toHaveBeenCalledWith('comp-1', 'tic-1', 'closed');
    });
  });

  describe('getTicketMessages', () => {
    it('should get messages', async () => {
      mockContext.get.mockReturnValue('comp-1');
      mockContext.req.param.mockReturnValue('tic-1');
      (SupportService.prototype.getTicketMessages as any).mockResolvedValue([{ id: 'msg-1' }]);

      await getTicketMessages(mockContext);
      expect(SupportService.prototype.getTicketMessages).toHaveBeenCalledWith('tic-1');
    });
  });

  describe('addTicketMessage', () => {
    it('should add a message', async () => {
      mockContext.get.mockImplementation((key: string) => {
        if (key === 'companyId') return 'comp-1';
        if (key === 'employeeId') return 'emp-1';
      });
      mockContext.req.param.mockReturnValue('tic-1');
      mockContext.req.json.mockResolvedValue({ message: 'Hello' });

      await addTicketMessage(mockContext);
      expect(SupportService.prototype.addTicketMessage).toHaveBeenCalledWith('tic-1', 'emp-1', 'Hello');
    });
  });
});
