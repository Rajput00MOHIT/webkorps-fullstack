import type { OpportunityPriority, OpportunityEffort } from './opportunityTypes.js';

export class OpportunityScorer {
  /**
   * Deterministically calculates explainable priority score and classification.
   * Formula:
   *   evidenceMultiplier = 1.0 + min(1.0, evidenceCount * 0.15)
   *   effortDivisor = LOW: 1.0, MEDIUM: 1.3, HIGH: 1.8
   *   rawScore = (impact * confidence * evidenceMultiplier) / effortDivisor
   *   clampedScore = max(1.0, min(100.0, rawScore))
   */
  public static calculateScore(params: {
    impact: number; // 1-100
    confidence: number; // 0.1-1.0
    effort: OpportunityEffort;
    evidenceCount: number;
  }): { score: number; priority: OpportunityPriority } {
    const impact = Math.max(1, Math.min(100, params.impact));
    const confidence = Math.max(0.1, Math.min(1.0, params.confidence));

    let effortDivisor = 1.3;
    if (params.effort === 'LOW') effortDivisor = 1.0;
    else if (params.effort === 'HIGH') effortDivisor = 1.8;

    const evidenceMultiplier = 1.0 + Math.min(1.0, (params.evidenceCount || 1) * 0.15);
    const rawScore = (impact * confidence * evidenceMultiplier) / effortDivisor;
    const score = Number(Math.max(1.0, Math.min(100.0, rawScore)).toFixed(1));

    let priority: OpportunityPriority = 'LOW';
    if (score >= 80) priority = 'CRITICAL';
    else if (score >= 60) priority = 'HIGH';
    else if (score >= 40) priority = 'MEDIUM';
    else priority = 'LOW';

    return { score, priority };
  }
}
