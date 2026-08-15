import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as peerReviewController from '../../../src/controllers/employee/peerReview.controller';
import { PeerReviewService } from '../../../src/services/peerReview.service';
import { ReviewCycleService } from '../../../src/services/reviewCycle.service';

vi.mock('../../../src/services/peerReview.service');
vi.mock('../../../src/services/reviewCycle.service');

describe('Employee Peer Review Controller', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    PeerReviewService.prototype.nominate = vi.fn();
    PeerReviewService.prototype.getMyNominations = vi.fn();
    PeerReviewService.prototype.getTeamPendingApprovals = vi.fn();
    PeerReviewService.prototype.approveNomination = vi.fn();
    PeerReviewService.prototype.getAssignedToMe = vi.fn();
    PeerReviewService.prototype.submitPeerReview = vi.fn();
    PeerReviewService.prototype.submitUpwardReview = vi.fn();
    ReviewCycleService.prototype.getActiveCycle = vi.fn();
    ReviewCycleService.prototype.isStageOpen = vi.fn();

    mockContext = {
      req: {
        query: vi.fn(),
        param: vi.fn(),
        json: vi.fn(),
      },
      env: { DB: {} },
      get: vi.fn(),
      json: vi.fn((data, status) => ({ data, status })),
    };
  });

  it('nominatePeers should nominate', async () => {
    mockContext.get.mockImplementation((k: string) => {
      if (k === 'companyId') return 'comp-1';
      if (k === 'employeeId') return 'emp-1';
    });
    mockContext.req.json.mockResolvedValue({ peerIds: ['emp-2'] });
    (ReviewCycleService.prototype.getActiveCycle as any).mockResolvedValue({ id: 'cyc-1' });
    (ReviewCycleService.prototype.isStageOpen as any).mockResolvedValue(true);
    (PeerReviewService.prototype.nominate as any).mockResolvedValue([{ id: 'nom-1' }]);

    const res = await peerReviewController.nominatePeers(mockContext);
    expect(PeerReviewService.prototype.nominate).toHaveBeenCalled();
  });
});
