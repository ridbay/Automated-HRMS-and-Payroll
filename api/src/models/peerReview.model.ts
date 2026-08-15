import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Covers both 360 peer reviews and upward reviews (a direct report
// reviewing their manager) — same shape, distinguished by `direction`.
//
// Peer flow:   nominated -> approved|rejected (by reviewee's manager) -> submitted
// Upward flow: no nomination/approval gate; created straight into
//              'approved' status and filled in by the reviewer once, then
//              submitted — see PeerReviewService.submitUpwardReview.
export const peerReviews = sqliteTable('peer_reviews', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  cycleId: text('cycle_id').notNull(),
  revieweeId: text('reviewee_id').notNull(), // the person being reviewed
  reviewerId: text('reviewer_id').notNull(), // the person writing the review
  direction: text('direction').notNull(), // 'peer' | 'upward'
  status: text('status').notNull().default('nominated'), // 'nominated' | 'approved' | 'rejected' | 'submitted'
  rating: text('rating'), // same 5-point scale as assessments.selfRating; set on submit
  strengths: text('strengths'),
  improvements: text('improvements'),
  comment: text('comment'),
  nominatedById: text('nominated_by_id'),
  approvedById: text('approved_by_id'),
  approvedAt: text('approved_at'),
  submittedAt: text('submitted_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
