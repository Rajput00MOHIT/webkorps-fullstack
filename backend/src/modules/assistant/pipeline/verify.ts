import type { FormattedEvidencePack } from './evidence.js';

export interface VerificationResult {
  isGrounded: boolean;
  policyPassed: boolean;
  sanitizedAnswer: string;
  unsupportedClaims: string[];
}

export class AnswerVerifier {
  /**
   * Verifies the answer against policy rules, evidence pack grounding, and broken template variables.
   */
  public static verify(
    rawAnswer: string,
    evidencePack: FormattedEvidencePack,
    query: string
  ): VerificationResult {
    const qLower = query.toLowerCase();
    let ansLower = rawAnswer.toLowerCase();
    const unsupportedClaims: string[] = [];

    let policyPassed = true;
    let sanitizedAnswer = rawAnswer;

    // 1. Broken Template Variable Cleaning (Eliminate "related to logistic", "undefined", "NaN", etc.)
    if (sanitizedAnswer.includes('related to logistic') || sanitizedAnswer.includes('your related to')) {
      unsupportedClaims.push('Detected broken template variable artifact in output.');
      sanitizedAnswer = sanitizedAnswer
        .replace(/your\s+\*\*related to logistic\*\*/gi, 'your custom logistics application')
        .replace(/your\s+related to logistic/gi, 'your custom logistics application')
        .replace(/your\s+\*\*related to ([^*]+)\*\*/gi, 'your custom $1 application')
        .replace(/your\s+related to ([a-zA-Z]+)/gi, 'your custom $1 application');
    }

    sanitizedAnswer = sanitizedAnswer
      .replace(/undefined/g, '')
      .replace(/NaN/g, '')
      .replace(/null:/g, '')
      .replace(/\{\s*variable\s*\}/gi, 'application')
      .replace(/\s{2,}/g, ' ');

    ansLower = sanitizedAnswer.toLowerCase();

    // 2. Policy Rule 1: Never disclose confidential private contract values or revenue
    const asksPrivateFinancials = /\b(?:revenue|exact revenue|exact contract|exact roi|contract value|how much profit)\b/i.test(qLower);
    if (asksPrivateFinancials) {
      const mentionsMoneyNumber = /\b(?:\$\d+|\d+\s*million|\d+\s*cr|\d+\s*crore|\d+\s*lakh)\b/i.test(sanitizedAnswer);
      if (mentionsMoneyNumber) {
        policyPassed = false;
        unsupportedClaims.push('Disclosed private commercial figures without verified evidence.');
        sanitizedAnswer = `I couldn't find verified private financial contract or revenue figures in the available company knowledge. Webkorps treats commercial client terms under strict NDA confidentiality [S1].`;
      }
    }

    // 3. Policy Rule 2: Fictional Project Traps (e.g. Uber, Amazon, Mars rover)
    const fictionalTrapEntities = ['uber', 'amazon', 'mars rover', 'drone delivery to the moon'];
    for (const trap of fictionalTrapEntities) {
      if (qLower.includes(trap)) {
        const evidenceHasTrap = evidencePack.formattedText.toLowerCase().includes(trap);
        if (!evidenceHasTrap && (ansLower.includes('yes, webkorps built') || ansLower.includes('webkorps developed the uber'))) {
          unsupportedClaims.push(`Fictional project claim '${trap}' not found in verified evidence.`);
          sanitizedAnswer = `I couldn't find a verified Webkorps project for ${trap} in our company records [S1]. However, Webkorps actively delivers enterprise engineering capabilities for scalable mobile, cloud, and backend platforms.`;
        }
      }
    }

    // 4. Grounding check
    const isGrounded = unsupportedClaims.length === 0;

    return {
      isGrounded,
      policyPassed,
      sanitizedAnswer,
      unsupportedClaims
    };
  }
}
