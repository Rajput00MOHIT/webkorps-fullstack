import { URL } from 'url';

export interface ParsedMention {
  entityName: string;
  mentioned: boolean;
  position?: number;
  mentionContext?: string;
  recommendationSignal: boolean;
  confidence: number;
}

export interface ParsedCitation {
  citedUrl: string;
  citedDomain: string;
  citedTitle?: string;
  citationContext?: string;
  citationPosition?: number;
  isTargetDomain: boolean;
}

export interface ParsedCompetitorMention {
  competitorName: string;
  mentioned: boolean;
  position?: number;
  recommendationSignal: boolean;
  context?: string;
}

export interface ObservationParseResult {
  targetMention: ParsedMention;
  competitors: ParsedCompetitorMention[];
  citations: ParsedCitation[];
}

export class ObservationParser {
  private static RECOMMENDATION_KEYWORDS = [
    /\brecommend(ed|s)?\b/i,
    /\btop (choice|pick|rated|tier|player|agency|firm|company|developer)\b/i,
    /\bleading\b/i,
    /\bbest\b/i,
    /\bstrong option\b/i,
    /\bexpert\b/i,
    /\btrusted\b/i,
    /\bgo-to\b/i,
    /\bpremier\b/i
  ];

  private static DEFAULT_COMPETITORS = [
    'Persistent Systems',
    'Tata Elxsi',
    'Infosys',
    'Wipro',
    'L&T Technology Services',
    'Accenture',
    'HCLTech',
    'Cognizant',
    'Mindtree',
    'Coforge',
    'Cybage',
    'Kellton Tech'
  ];

  public static parse(
    rawResponse: string,
    targetEntity: string = 'Webkorps',
    targetDomain: string = 'webkorps.com',
    configuredCompetitors?: string[]
  ): ObservationParseResult {
    const text = rawResponse || '';
    const paragraphs = text
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const targetMention = this.parseTargetMention(text, paragraphs, targetEntity);
    const competitorList = configuredCompetitors && configuredCompetitors.length > 0
      ? configuredCompetitors
      : this.DEFAULT_COMPETITORS;
    const competitors = this.parseCompetitorMentions(text, paragraphs, competitorList);
    const citations = this.parseCitations(text, paragraphs, targetDomain);

    return { targetMention, competitors, citations };
  }

  private static parseTargetMention(
    fullText: string,
    paragraphs: string[],
    targetEntity: string
  ): ParsedMention {
    const escaped = targetEntity.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');

    if (!regex.test(fullText)) {
      return {
        entityName: targetEntity,
        mentioned: false,
        recommendationSignal: false,
        confidence: 1.0
      };
    }

    let position = 1;
    let mentionContext = '';
    let recommendationSignal = false;

    for (let i = 0; i < paragraphs.length; i++) {
      if (regex.test(paragraphs[i])) {
        position = i + 1;
        mentionContext = paragraphs[i].slice(0, 500);
        for (const kw of this.RECOMMENDATION_KEYWORDS) {
          if (kw.test(paragraphs[i])) {
            recommendationSignal = true;
            break;
          }
        }
        break;
      }
    }

    return {
      entityName: targetEntity,
      mentioned: true,
      position,
      mentionContext,
      recommendationSignal,
      confidence: 0.95
    };
  }

  private static parseCompetitorMentions(
    fullText: string,
    paragraphs: string[],
    competitorList: string[]
  ): ParsedCompetitorMention[] {
    const mentions: ParsedCompetitorMention[] = [];

    for (const comp of competitorList) {
      const escaped = comp.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');

      if (regex.test(fullText)) {
        let position = 1;
        let context = '';
        let rec = false;

        for (let i = 0; i < paragraphs.length; i++) {
          if (regex.test(paragraphs[i])) {
            position = i + 1;
            context = paragraphs[i].slice(0, 400);
            for (const kw of this.RECOMMENDATION_KEYWORDS) {
              if (kw.test(paragraphs[i])) {
                rec = true;
                break;
              }
            }
            break;
          }
        }

        mentions.push({
          competitorName: comp,
          mentioned: true,
          position,
          recommendationSignal: rec,
          context
        });
      }
    }

    return mentions;
  }

  private static parseCitations(
    fullText: string,
    paragraphs: string[],
    targetDomain: string
  ): ParsedCitation[] {
    const citations: ParsedCitation[] = [];
    const seenUrls = new Set<string>();

    const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match: RegExpExecArray | null;

    let citationPos = 1;
    while ((match = mdRegex.exec(fullText)) !== null) {
      const title = match[1];
      const url = match[2];
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        try {
          const parsed = new URL(url);
          const isTarget = parsed.hostname.toLowerCase().includes(targetDomain.toLowerCase());
          citations.push({
            citedUrl: url,
            citedDomain: parsed.hostname,
            citedTitle: title,
            citationContext: match[0],
            citationPosition: citationPos++,
            isTargetDomain: isTarget
          });
        } catch {}
      }
    }

    const rawUrlRegex = /(https?:\/\/[^\s"'`\)\]>]+)/g;
    while ((match = rawUrlRegex.exec(fullText)) !== null) {
      const url = match[1];
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        try {
          const parsed = new URL(url);
          const isTarget = parsed.hostname.toLowerCase().includes(targetDomain.toLowerCase());
          citations.push({
            citedUrl: url,
            citedDomain: parsed.hostname,
            citedTitle: parsed.hostname,
            citationContext: url,
            citationPosition: citationPos++,
            isTargetDomain: isTarget
          });
        } catch {}
      }
    }

    return citations;
  }
}
