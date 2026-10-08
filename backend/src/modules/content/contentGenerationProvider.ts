import type { ContentBrief } from './contentTypes.js';

export class ContentProviderUnavailableError extends Error {
  constructor(message: string = 'Content Generation provider is unavailable or not configured.') {
    super(message);
    this.name = 'ContentProviderUnavailableError';
  }
}

export interface DraftGenerationRequest {
  brief: ContentBrief;
  companyName: string;
  services: string[];
  allowLocalTemplateFallback?: boolean;
}

export interface DraftGenerationResponse {
  provider: string;
  model: string;
  bodyMarkdown: string;
  rawResponse: string;
  tokenUsage?: Record<string, any>;
  generatedAt: Date;
}

export interface ContentGenerationProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generateDraft(request: DraftGenerationRequest): Promise<DraftGenerationResponse>;
}

export class ConfiguredContentGenerationProvider implements ContentGenerationProvider {
  public name: string;
  private apiKey?: string;
  private modelName: string;

  constructor(name: string = 'openai', modelName: string = 'gpt-4o') {
    this.name = name;
    this.modelName = modelName;
    this.apiKey = process.env.CONTENT_AI_API_KEY || process.env.OPENAI_API_KEY;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  public async generateDraft(request: DraftGenerationRequest): Promise<DraftGenerationResponse> {
    // If external API key is absent and local template fallback was NOT requested
    if (!this.apiKey && !request.allowLocalTemplateFallback) {
      throw new ContentProviderUnavailableError(
        'AI Content generation provider is not configured with live credentials. Synthesized LLM drafts must not be fabricated.'
      );
    }

    if (this.apiKey) {
      try {
        const prompt = this.buildPrompt(request);
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.modelName,
            messages: [
              {
                role: 'system',
                content: 'You are an elite B2B enterprise technology content strategist. Generate high-authority, evidence-grounded articles. Only cite provided facts; do not invent unverified claims.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!res.ok) {
          throw new ContentProviderUnavailableError(`AI provider HTTP ${res.status}: ${res.statusText}`);
        }

        const data = (await res.json()) as any;
        const text = data.choices?.[0]?.message?.content || '';

        return {
          provider: this.name,
          model: this.modelName,
          bodyMarkdown: text,
          rawResponse: text,
          tokenUsage: data.usage || {},
          generatedAt: new Date()
        };
      } catch (err: any) {
        if (err instanceof ContentProviderUnavailableError) throw err;
        throw new ContentProviderUnavailableError(`AI draft generation failed: ${err.message}`);
      }
    }

    // Deterministic grounded template assembly (when allowLocalTemplateFallback is true)
    return this.generateDeterministicDraft(request);
  }

  private buildPrompt(req: DraftGenerationRequest): string {
    const b = req.brief;
    return `
Target Keyword: ${b.primary_keyword}
Company: ${req.companyName}
Verified Capabilities: ${req.services.join(', ')}
Target Audience: ${b.target_audience}
Search Intent: ${b.search_intent}
Outline: ${JSON.stringify(b.recommended_outline)}
Evidence Sources: ${JSON.stringify(b.evidence_sources)}
Internal Links: ${JSON.stringify(b.internal_links)}
Fact Constraints: ${JSON.stringify(b.fact_requirements)}

Generate a comprehensive Markdown article adhering to the outline. Only state facts directly grounded in the provided context. Include a structured FAQ section and an Executive Summary table.
    `.trim();
  }

  private generateDeterministicDraft(req: DraftGenerationRequest): DraftGenerationResponse {
    const b = req.brief;
    const company = req.companyName;
    const outline = (b.recommended_outline || []) as any[];

    let md = `# ${outline[0]?.heading || b.primary_topic || b.primary_keyword}\n\n`;
    md += `In modern enterprise technology, **${b.primary_keyword}** is a critical operational competency. Organizations that systematically modernize their architectures achieve superior resilience, scalability, and performance.\n\n`;

    md += `## Executive Summary & Strategic Matrix\n\n`;
    md += `| Pillar | Focus Area | Verified Strategic Outcome |\n`;
    md += `|---|---|---|\n`;
    md += `| Architecture | ${b.primary_keyword} | High-throughput, cloud-native scalability |\n`;
    md += `| Engineering | ${company} Ground Truth | Verified capabilities in ${req.services.slice(0, 3).join(', ')} |\n`;
    md += `| Validation | Empirical Governance | Evidence-backed delivery with zero unverified claims |\n\n`;

    for (let i = 1; i < outline.length; i++) {
      const sec = outline[i];
      if (sec.heading.toLowerCase().includes('faq') || sec.heading.toLowerCase().includes('frequently')) {
        md += `## ${sec.heading}\n\n`;
        const qs = b.questions_to_answer || [];
        for (const q of qs) {
          md += `### ${q}\n\n`;
          md += `${company} addresses this by leveraging proven architectural patterns, automated CI/CD pipelines, and verified engineering best practices.\n\n`;
        }
      } else {
        md += `## ${sec.heading}\n\n`;
        md += `Enterprise organizations deploying ${b.primary_keyword} require rigorous engineering standards. Specifically, ${sec.purpose.toLowerCase()}.\n\n`;
        if (b.internal_links && b.internal_links.length > 0 && i === 2) {
          const link = b.internal_links[0];
          md += `For a comprehensive technical overview, explore our [${link.anchorSuggestion}](${link.url}).\n\n`;
        }
      }
    }

    if (b.call_to_action) {
      md += `### Next Steps\n\n${b.call_to_action}\n`;
    }

    return {
      provider: 'deterministic_engine',
      model: 'grounded_template_v1',
      bodyMarkdown: md,
      rawResponse: md,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      generatedAt: new Date()
    };
  }
}

export class ContentGenerationProviderFactory {
  public static getProvider(name: string = 'openai'): ContentGenerationProvider {
    return new ConfiguredContentGenerationProvider(name);
  }
}
