import type { LeadQualification, LeadScoreBreakdown, LeadPriority } from './leadTypes.js';

export interface LeadScoreInput {
  message: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadIntentLevel?: string;
  matchedServiceName?: string;
  matchedServiceId?: string;
  conversationTurnsCount?: number;
}

export class LeadScorer {
  /**
   * Deterministic, explainable lead scoring and qualification formula.
   * Score = (Intent × 0.35) + (Fit × 0.25) + (Urgency × 0.15) + (Completeness × 0.15) + (Engagement × 0.10)
   */
  public static evaluate(input: LeadScoreInput): {
    qualification: LeadQualification;
    scoreBreakdown: LeadScoreBreakdown;
  } {
    const textLower = (input.message || '').toLowerCase();
    const emailLower = (input.email || '').toLowerCase();
    const reasons: string[] = [];

    // 1. INTENT EVALUATION (Weight: 35%)
    let intentScore = 20;
    let intentLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';

    const highIntentRegex = /\b(?:hire|quote|pricing|how much|cost|proposal|consultation|schedule a call|talk to sales|book a meeting|ready to start|contract)\b/i;
    const medIntentRegex = /\b(?:timeline|estimate|rates|budget|available to start|work with us|project scope)\b/i;

    if (input.leadIntentLevel === 'HIGH' || highIntentRegex.test(textLower)) {
      intentScore = 100;
      intentLevel = 'HIGH';
      reasons.push('+35 High procurement intent / explicit hiring consultation inquiry');
    } else if (input.leadIntentLevel === 'MEDIUM' || medIntentRegex.test(textLower)) {
      intentScore = 70;
      intentLevel = 'MEDIUM';
      reasons.push('+25 Commercial engagement scope & estimate inquiry');
    } else if (input.leadIntentLevel === 'LOW' || textLower.length > 50) {
      intentScore = 40;
      intentLevel = 'LOW';
      reasons.push('+14 Exploratory capabilities inquiry');
    } else {
      intentScore = 20;
      intentLevel = 'NONE';
      reasons.push('+7 General informational interaction');
    }

    // 2. FIT EVALUATION (Weight: 25%)
    let fitScore = 30;
    let fitLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    const isCorporateDomain = emailLower.includes('@') && !emailLower.includes('@gmail.') && !emailLower.includes('@yahoo.') && !emailLower.includes('@hotmail.') && !emailLower.includes('@outlook.');

    if (input.matchedServiceName && isCorporateDomain) {
      fitScore = 100;
      fitLevel = 'HIGH';
      reasons.push(`+25 Perfect capability fit (${input.matchedServiceName}) with corporate business email`);
    } else if (input.matchedServiceName || isCorporateDomain) {
      fitScore = 70;
      fitLevel = 'MEDIUM';
      reasons.push(input.matchedServiceName ? `+18 Verified service alignment (${input.matchedServiceName})` : '+18 Corporate domain email verified');
    } else {
      fitScore = 30;
      fitLevel = 'LOW';
      reasons.push('+8 General consumer contact domain');
    }

    // 3. URGENCY EVALUATION (Weight: 15%)
    let urgencyScore = 30;
    let urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    const urgentRegex = /\b(?:immediate|immediately|asap|urgent|this week|this month|right away|start now|q1|q2|deadline)\b/i;
    const medUrgentRegex = /\b(?:next month|planning|next quarter|soon|in a few weeks)\b/i;

    if (urgentRegex.test(textLower)) {
      urgencyScore = 100;
      urgencyLevel = 'HIGH';
      reasons.push('+15 Immediate procurement timeline indicated (ASAP/This Month)');
    } else if (medUrgentRegex.test(textLower)) {
      urgencyScore = 60;
      urgencyLevel = 'MEDIUM';
      reasons.push('+9 Near-term project roadmap timeline');
    } else {
      urgencyScore = 30;
      urgencyLevel = 'LOW';
      reasons.push('+5 Standard/Unspecified project timeline');
    }

    // 4. COMPLETENESS EVALUATION (Weight: 15%)
    let completenessScore = 0;
    if (input.email) completenessScore += 30;
    if (input.phone && input.phone.trim().length >= 7) completenessScore += 25;
    if (input.company && input.company.trim().length > 1) completenessScore += 25;
    if (input.jobTitle && input.jobTitle.trim().length > 1) completenessScore += 20;

    let completenessLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (completenessScore >= 80) {
      completenessLevel = 'HIGH';
      reasons.push('+15 Complete enterprise profile provided (Company, Phone, Role)');
    } else if (completenessScore >= 50) {
      completenessLevel = 'MEDIUM';
      reasons.push('+9 Essential contact details provided');
    } else {
      completenessLevel = 'LOW';
      reasons.push('+4 Minimal contact information provided');
    }

    // 5. ENGAGEMENT EVALUATION (Weight: 10%)
    let engagementScore = 30;
    let engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    const turns = input.conversationTurnsCount || 1;
    const msgLen = (input.message || '').length;

    if (turns >= 3 || msgLen > 150) {
      engagementScore = 100;
      engagementLevel = 'HIGH';
      reasons.push('+10 Deep multi-turn interaction & detailed requirement scope');
    } else if (turns >= 2 || msgLen > 60) {
      engagementScore = 70;
      engagementLevel = 'MEDIUM';
      reasons.push('+7 Moderate engagement depth');
    } else {
      engagementScore = 40;
      engagementLevel = 'LOW';
      reasons.push('+4 Single-turn interaction');
    }

    // FINAL WEIGHTED FORMULA
    const rawScore =
      intentScore * 0.35 +
      fitScore * 0.25 +
      urgencyScore * 0.15 +
      completenessScore * 0.15 +
      engagementScore * 0.10;

    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    // PRIORITY THRESHOLDS
    let priority: LeadPriority = 'LOW';
    if (finalScore >= 80) priority = 'URGENT';
    else if (finalScore >= 65) priority = 'HIGH';
    else if (finalScore >= 45) priority = 'MEDIUM';
    else priority = 'LOW';

    // CATEGORY
    let scoreCategory: 'HOT' | 'WARM' | 'COLD' = 'COLD';
    if (finalScore >= 75) scoreCategory = 'HOT';
    else if (finalScore >= 45) scoreCategory = 'WARM';
    else scoreCategory = 'COLD';

    return {
      qualification: {
        intentLevel,
        fitLevel,
        urgencyLevel,
        completenessLevel,
        engagementLevel,
        matchedServiceName: input.matchedServiceName,
        matchedServiceId: input.matchedServiceId
      },
      scoreBreakdown: {
        score: finalScore,
        priority,
        scoreCategory,
        reasons,
        dimensions: {
          intentScore,
          fitScore,
          urgencyScore,
          completenessScore,
          engagementScore
        }
      }
    };
  }
}
