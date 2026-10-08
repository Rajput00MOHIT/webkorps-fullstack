import { REWRITE_SYSTEM_PROMPT } from '../prompts/rewritePrompt.js';
import type { Message } from '../assistantTypes.js';

export interface RewrittenQueryAnalysis {
  standalone_question: string;
  language: 'english' | 'hindi' | 'hinglish';
  scope: 'company' | 'general' | 'hybrid';
  entities: {
    industry: string[];
    service: string[];
    tech: string[];
    project_type: string | null;
  };
  lead_signal: 'none' | 'low' | 'medium' | 'high';
  needs_web: boolean;
  confidence: number;
}

export class QueryRewriter {
  /**
   * Analyzes conversation history and latest message to synthesize a standalone search question and semantic metadata.
   */
  public static async analyze(
    rawQuery: string,
    history: Message[] = [],
    callLlmFn?: (system: string, user: string) => Promise<string>
  ): Promise<RewrittenQueryAnalysis> {
    const rawTrimmed = rawQuery.trim();
    const rawLower = rawTrimmed.toLowerCase();

    // If an LLM call function is provided and available, use it with schema validation and retry
    if (callLlmFn) {
      try {
        const historyContext = history.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
        const userPrompt = `Conversation History:\n${historyContext || 'None (New Conversation)'}\n\nLatest User Message: "${rawTrimmed}"`;

        const llmResponse = await callLlmFn(REWRITE_SYSTEM_PROMPT, userPrompt);
        const parsed = this.parseAndValidate(llmResponse);
        if (parsed) {
          return parsed;
        }
      } catch (err) {
        // Fallback to deterministic semantic analysis
      }
    }

    // Deterministic Semantic Parser (Fallback & Fast In-Process Analyzer)
    return this.deterministicAnalysis(rawTrimmed, rawLower, history);
  }

  private static parseAndValidate(jsonText: string): RewrittenQueryAnalysis | null {
    try {
      const cleaned = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const obj = JSON.parse(cleaned);

      if (typeof obj.standalone_question !== 'string') return null;

      return {
        standalone_question: obj.standalone_question,
        language: ['english', 'hindi', 'hinglish'].includes(obj.language) ? obj.language : 'english',
        scope: ['company', 'general', 'hybrid'].includes(obj.scope) ? obj.scope : 'company',
        entities: {
          industry: Array.isArray(obj.entities?.industry) ? obj.entities.industry : [],
          service: Array.isArray(obj.entities?.service) ? obj.entities.service : [],
          tech: Array.isArray(obj.entities?.tech) ? obj.entities.tech : [],
          project_type: typeof obj.entities?.project_type === 'string' ? obj.entities.project_type : null
        },
        lead_signal: ['none', 'low', 'medium', 'high'].includes(obj.lead_signal) ? obj.lead_signal : 'none',
        needs_web: Boolean(obj.needs_web),
        confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.9
      };
    } catch {
      return null;
    }
  }

  private static deterministicAnalysis(
    raw: string,
    rawLower: string,
    history: Message[]
  ): RewrittenQueryAnalysis {
    const rawTrimmed = raw.trim();
    // 1. Language Detection (English vs Hindi vs Hinglish)
    let language: 'english' | 'hindi' | 'hinglish' = 'english';
    const hinglishTokens = ['kya', 'kaise', 'kese', 'karo', 'batao', 'chahiye', 'mujhe', 'humko', 'hai', 'hain', 'nahi', 'karna', 'banwana', 'banana', 'aur', 'kitna', 'hoga'];
    if (hinglishTokens.some(t => new RegExp(`\\b${t}\\b`, 'i').test(rawLower))) {
      language = 'hinglish';
    }

    // 2. Lead Signal Detection
    let leadSignal: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (/\b(?:price|pricing|cost|how much|charges|amount|hire|quote|talk to sales|book a call|meeting|commercials|kitna cost)\b/i.test(rawLower)) {
      leadSignal = 'high';
    } else if (/\b(?:timeline|estimate|duration|how long|kitna time|kab tak)\b/i.test(rawLower)) {
      leadSignal = 'medium';
    } else if (/\b(?:engagement model|interested|work with you)\b/i.test(rawLower)) {
      leadSignal = 'low';
    }

    // 3. Industry & Entity Extraction
    const isCompanyMeta = /\b(?:ceo|coo|founder|founders|leadership|management|executive|director|directors|headquarters|office|offices|team size|employees|engineers|how many|founded|certifications|iso|about webkorps|who is webkorps)\b/i.test(rawLower);

    const industryMap: Record<string, string> = {
      health: 'healthcare', healthcare: 'healthcare', healthtech: 'healthcare', medical: 'healthcare', telemedicine: 'healthcare',
      logistic: 'logistics', logistics: 'logistics', 'supply chain': 'logistics', fleet: 'logistics', freight: 'logistics', warehouse: 'logistics',
      fintech: 'fintech', banking: 'fintech', payment: 'fintech', payments: 'fintech',
      coffee: 'retail_food_beverage', cafe: 'retail_food_beverage', restaurant: 'retail_food_beverage', food: 'retail_food_beverage',
      ecommerce: 'ecommerce', 'e-commerce': 'ecommerce', retail: 'ecommerce', shop: 'ecommerce', store: 'ecommerce',
      education: 'education', elearning: 'education', edtech: 'education',
      realestate: 'real estate', 'real estate': 'real estate', proptech: 'real estate',
      manufacturing: 'manufacturing', iot: 'manufacturing'
    };

    const industries: string[] = [];
    if (!isCompanyMeta) {
      for (const [kw, ind] of Object.entries(industryMap)) {
        if (rawLower.includes(kw)) {
          if (!industries.includes(ind)) industries.push(ind);
        }
      }

      // If current message didn't specify an industry, look at recent history ONLY if this is a direct follow-up
      if (industries.length === 0 && history.length > 0) {
        const isFollowup = /^(?:how|what|why|tell me more|explain|and|can you|how they help|what about)\b/i.test(rawLower) || rawTrimmed.length < 20;
        if (isFollowup) {
          const historyText = history.slice(-2).map(m => m.text.toLowerCase()).join(' ');
          for (const [kw, ind] of Object.entries(industryMap)) {
            if (historyText.includes(kw)) {
              if (!industries.includes(ind)) industries.push(ind);
              break;
            }
          }
        }
      }
    }

    // 4. Technology Extraction
    const techKeywords = [
      'flutter', 'react native', 'react', 'next.js', 'typescript', 'node.js',
      'python', 'fastapi', 'django', 'java', 'spring boot', 'go', 'golang',
      'postgresql', 'postgis', 'redis', 'mongodb', 'aws', 'gcp', 'docker', 'kubernetes'
    ];
    const tech: string[] = [];
    for (const tk of techKeywords) {
      if (new RegExp(`\\b${tk}\\b`, 'i').test(rawLower)) {
        tech.push(tk);
      }
    }

    // 5. Project Type Extraction
    let projectType: string | null = null;
    if (/\b(?:mobile app|ios app|android app|mobile application|app)\b/i.test(rawLower)) {
      projectType = 'mobile_application';
    } else if (/\b(?:web app|web portal|dashboard|portal|platform|website)\b/i.test(rawLower)) {
      projectType = 'web_platform';
    } else if (/\b(?:dispatch|tracking system|fleet management)\b/i.test(rawLower)) {
      projectType = 'dispatch_system';
    }

    // 6. Scope Detection
    const mentionsCompany = /\b(?:webkorps|your team|your company|do you|you provide|you build|have you|has webkorps|can webkorps)\b/i.test(rawLower);
    const asksGeneralConcept = /^(?:what is |explain |define |how does route optimization work)/i.test(rawLower);

    let scope: 'company' | 'general' | 'hybrid' = 'company';
    if (!mentionsCompany && asksGeneralConcept) {
      scope = 'general';
    } else if (mentionsCompany && (rawLower.includes('should i') || rawLower.includes('recommend') || rawLower.includes('suitable') || rawLower.includes('best stack'))) {
      scope = 'hybrid';
    }

    // 7. Freshness / Web Need
    const needsWeb = /\b(?:latest|recent|news|this month|2026|recently)\b/i.test(rawLower);

    // 8. Synthesize Standalone Search Question
    let standalone = raw;
    const activeIndustry = industries[0];

    // Handle short follow-up resolution (only when query itself is very short and ambiguous, <= 3 words)
    const wordCount = rawTrimmed.split(/\s+/).length;
    const isShortFollowup = wordCount <= 3 && /^(?:how\??|what\??|why\??|how so\??|how they help\??|how can you help\??|explain\??|tell me more\??|and\??|what about it\??)$/i.test(rawTrimmed);
    if (isShortFollowup && history.length > 0) {
      const lastSubstantiveMsg = [...history].reverse().find(m => m.role === 'user' && m.text.trim().split(/\s+/).length > 3)?.text || '';
      if (lastSubstantiveMsg) {
        standalone = `How does Webkorps provide custom engineering solutions for: "${lastSubstantiveMsg}"`;
      }
    } else if (leadSignal === 'high') {
      standalone = activeIndustry
        ? `Webkorps commercial pricing, engagement models, and estimation for ${activeIndustry} software development`
        : `Webkorps commercial pricing, engagement models, and dedicated team costs`;
    } else if (rawLower.startsWith('what technologies') || rawLower.startsWith('what stack')) {
      standalone = activeIndustry
        ? `Recommended technology stack, frameworks, and Webkorps capabilities for ${activeIndustry} ${projectType || 'application'}`
        : `Webkorps enterprise technology stack, frameworks, and programming languages`;
    } else if (rawLower.startsWith('what features') || rawLower.includes('tracking feature')) {
      standalone = activeIndustry
        ? `Core features, system modules, and architecture for ${activeIndustry} ${projectType || 'platform'}`
        : `Essential application features, modules, and software architecture`;
    } else if (rawLower.includes('similar') || rawLower.includes('done anything') || rawLower.includes('case study') || rawLower.includes('past work')) {
      standalone = activeIndustry
        ? `Webkorps ${activeIndustry} case studies, client projects, and verified work portfolio`
        : `Webkorps client case studies, enterprise projects, and verified solutions`;
    }

    return {
      standalone_question: standalone,
      language,
      scope,
      entities: {
        industry: industries,
        service: [],
        tech,
        project_type: projectType
      },
      lead_signal: leadSignal,
      needs_web: needsWeb,
      confidence: 0.95
    };
  }
}
