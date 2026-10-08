import type { PromptCategory } from './geoTypes.js';

export interface CandidatePrompt {
  promptText: string;
  category: PromptCategory;
  targetEntity: string;
  language: string;
  region: string;
}

export class PromptGenerator {
  /**
   * Generates tailored candidate visibility prompts based on company services and market positioning.
   */
  public static generateCandidates(
    companyName: string = 'Webkorps',
    services: string[] = ['AI Development', 'Custom Software Development', 'Mobile App Development', 'Cloud Engineering', 'UI/UX Design'],
    locations: string[] = ['India', 'Indore', 'Madhya Pradesh'],
    competitors: string[] = ['Persistent Systems', 'Tata Elxsi', 'Infosys']
  ): CandidatePrompt[] {
    const candidates: CandidatePrompt[] = [];

    // 1. BRAND queries
    candidates.push({
      promptText: `What services does ${companyName} provide?`,
      category: 'BRAND',
      targetEntity: companyName,
      language: 'en',
      region: 'IN'
    });
    candidates.push({
      promptText: `Tell me about ${companyName} leadership and capabilities.`,
      category: 'BRAND',
      targetEntity: companyName,
      language: 'en',
      region: 'IN'
    });

    // 2. SERVICE queries
    for (const service of services.slice(0, 3)) {
      candidates.push({
        promptText: `Who are the best companies for ${service} in India?`,
        category: 'SERVICE',
        targetEntity: companyName,
        language: 'en',
        region: 'IN'
      });
      candidates.push({
        promptText: `Which companies provide top-tier ${service} services for enterprises?`,
        category: 'SERVICE',
        targetEntity: companyName,
        language: 'en',
        region: 'IN'
      });
    }

    // 3. LOCAL queries
    for (const loc of locations.slice(0, 2)) {
      candidates.push({
        promptText: `What are the top software and AI development companies in ${loc}?`,
        category: 'LOCAL',
        targetEntity: companyName,
        language: 'en',
        region: 'IN'
      });
    }

    // 4. RECOMMENDATION queries
    candidates.push({
      promptText: `Which companies would you recommend for building an AI-powered product in India?`,
      category: 'RECOMMENDATION',
      targetEntity: companyName,
      language: 'en',
      region: 'IN'
    });

    // 5. COMPARISON queries
    if (competitors.length > 0) {
      candidates.push({
        promptText: `Compare ${companyName} with ${competitors[0]} for enterprise software engineering.`,
        category: 'COMPARISON',
        targetEntity: companyName,
        language: 'en',
        region: 'IN'
      });
    }

    return candidates;
  }
}
