import { db } from '../../db/client.js';
import { AuditLogger } from '../audit/auditLogger.js';
import createHttpError from 'http-errors';
import type { ContentReview, ReviewDecision } from './contentTypes.js';

export interface SubmitReviewInput {
  decision: ReviewDecision;
  reviewerUserId?: string;
  reviewerName?: string;
  comments?: string;
  flags?: any[];
  metadata?: Record<string, any>;
}

export class ContentReviewService {
  /**
   * Submits human review decision on a generated content draft.
   * Strictly avoids automatic publishing. Content status updates to APPROVED, REJECTED, or NEEDS_REVIEW.
   */
  public static async submitReview(
    organizationId: string,
    draftId: string,
    input: SubmitReviewInput
  ): Promise<ContentReview> {
    const validDecisions: ReviewDecision[] = ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'];
    if (!validDecisions.includes(input.decision)) {
      throw createHttpError(400, `Invalid review decision. Must be one of: ${validDecisions.join(', ')}`);
    }

    // 1. Fetch draft and project
    const draftRes = await db.query(
      `SELECT d.*, p.id as project_id
       FROM content_drafts d
       JOIN content_projects p ON p.id = d.content_project_id
       WHERE d.id = $1 AND d.organization_id = $2`,
      [draftId, organizationId]
    );

    if (draftRes.rows.length === 0) {
      throw createHttpError(404, 'Content draft not found.');
    }
    const draft = draftRes.rows[0];

    // 2. Fetch recent validation scores
    const valRes = await db.query(
      `SELECT validation_type, score FROM content_validations WHERE draft_id = $1 AND organization_id = $2`,
      [draftId, organizationId]
    );

    let factScore = 100;
    let seoScore = 100;
    let originalityScore = 100;

    for (const row of valRes.rows) {
      if (row.validation_type === 'FACT_CHECK') factScore = row.score;
      if (row.validation_type === 'SEO_VALIDATION') seoScore = row.score;
      if (row.validation_type === 'DUPLICATE_CHECK' || row.validation_type === 'GEO_VALIDATION') {
        originalityScore = Math.min(originalityScore, row.score);
      }
    }

    const approvedAt = input.decision === 'APPROVED' ? new Date() : null;

    // 3. Insert Review Record
    const insertRes = await db.query(
      `INSERT INTO content_reviews (
        organization_id, draft_id, fact_check_score, seo_score, originality_score,
        decision, reviewer_user_id, reviewer_name, comments, flags, approved_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        organizationId,
        draftId,
        factScore,
        seoScore,
        originalityScore,
        input.decision,
        input.reviewerUserId || null,
        input.reviewerName || 'Content Reviewer',
        input.comments || null,
        JSON.stringify(input.flags || []),
        approvedAt,
        JSON.stringify(input.metadata || {})
      ]
    );

    const review = insertRes.rows[0];

    // 4. Update Draft & Project lifecycle status (Strictly no auto-publishing)
    let newDraftStatus = draft.status;
    let newProjectStatus = 'NEEDS_REVIEW';

    if (input.decision === 'APPROVED') {
      newDraftStatus = 'APPROVED';
      newProjectStatus = 'APPROVED';
    } else if (input.decision === 'REJECTED') {
      newDraftStatus = 'REJECTED';
      newProjectStatus = 'REJECTED';
    } else if (input.decision === 'CHANGES_REQUESTED') {
      newDraftStatus = 'NEEDS_REVIEW';
      newProjectStatus = 'NEEDS_REVIEW';
    }

    await db.query(
      `UPDATE content_drafts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3`,
      [newDraftStatus, draftId, organizationId]
    );

    await db.query(
      `UPDATE content_projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3`,
      [newProjectStatus, draft.project_id, organizationId]
    );

    // 5. Audit log
    await AuditLogger.log({
      organizationId,
      action: 'REVIEW_CONTENT_DRAFT',
      entityType: 'CONTENT_REVIEW',
      entityId: review.id,
      details: {
        draftId,
        decision: input.decision,
        reviewerName: input.reviewerName
      }
    });

    return review;
  }

  public static async getReviews(organizationId: string, draftId: string): Promise<ContentReview[]> {
    const res = await db.query(
      `SELECT * FROM content_reviews WHERE organization_id = $1 AND draft_id = $2 ORDER BY created_at DESC`,
      [organizationId, draftId]
    );
    return res.rows;
  }
}
