import type { RetrievalItem, AssistantMode, ConversationContext } from './assistantTypes.js';
import { AnswerGenerator } from './pipeline/generate.js';
import { EvidencePackBuilder } from './pipeline/evidence.js';
import { QueryRewriter } from './pipeline/rewrite.js';

export class AssistantProviderUnavailableError extends Error {
  constructor(message: string = 'Assistant AI provider is unavailable or not configured.') {
    super(message);
    this.name = 'AssistantProviderUnavailableError';
  }
}

export interface AssistantGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  companyName: string;
  query: string;
  evidence: RetrievalItem[];
  intent?: AssistantMode;
  context?: ConversationContext;
  isDissatisfied?: boolean;
  allowLocalFallback?: boolean;
}

export interface AssistantGenerationResponse {
  answer: string;
  provider: string;
  model: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface AssistantAIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(request: AssistantGenerationRequest): Promise<AssistantGenerationResponse>;
}

export class ConfiguredAssistantProvider implements AssistantAIProvider {
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

  public async generate(request: AssistantGenerationRequest): Promise<AssistantGenerationResponse> {
    const startTime = Date.now();

    // Call live external LLM if configured
    if (this.apiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.modelName,
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt }
            ],
            temperature: 0.1
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (!res.ok) {
          throw new AssistantProviderUnavailableError(`AI Assistant provider HTTP ${res.status}: ${res.statusText}`);
        }

        const data = (await res.json()) as any;
        const answer = data.choices?.[0]?.message?.content || '';
        const latencyMs = Date.now() - startTime;

        return {
          answer,
          provider: this.name,
          model: this.modelName,
          tokenUsage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0
          },
          latencyMs
        };
      } catch (err: any) {
        if (!request.allowLocalFallback) {
          throw new AssistantProviderUnavailableError(`AI Assistant response failed: ${err.message}`);
        }
      }
    }

    // Grounded Generation via Unified AnswerGenerator (No raw JSON, no shortcut templates)
    const evidencePack = EvidencePackBuilder.build(request.evidence);
    const analysis = await QueryRewriter.analyze(request.query, []);

    const genOutput = await AnswerGenerator.generate({
      companyName: request.companyName || 'Webkorps',
      rawQuery: request.query,
      analysis,
      evidencePack
    });

    return {
      answer: genOutput.answer,
      provider: 'unified_answer_generator',
      model: genOutput.model,
      tokenUsage: genOutput.tokenUsage,
      latencyMs: Date.now() - startTime
    };
  }
}

export class AssistantAIProviderFactory {
  public static getProvider(name: string = 'openai'): AssistantAIProvider {
    return new ConfiguredAssistantProvider(name);
  }
}
