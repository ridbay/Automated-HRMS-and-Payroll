import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupportService } from '../../src/services/support.service';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue({})
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn().mockResolvedValue([{ id: 'sup-1' }])
          }))
        }))
      }))
    }))
  }))
}));

describe('Support Service', () => {
  let service: SupportService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SupportService({} as any);
  });

  it('should create a support ticket', async () => {
    const res = await service.createTicket('comp-1', 'emp-1', { subject: 'Test', description: 'Test', priority: 'LOW' });
    expect(res).toBeDefined();
  });
  
  it('should get tickets', async () => {
    const res = await service.getTickets('comp-1');
    expect(res).toBeDefined();
  });
});
