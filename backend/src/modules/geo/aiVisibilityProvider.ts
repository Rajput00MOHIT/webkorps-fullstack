export interface AIVisibilityRequest {
  prompt: string;
  targetEntity: string;
  competitors?: string[];
  language?: string;
  region?: string;
  metadata?: Record<string, any>;
}

export interface AIVisibilityResponse {
  provider: string;
  model: string;
  rawResponse: string;
  timestamp: Date;
  citations?: Array<{ url: string; title?: string; domain?: string }>;
  metadata?: Record<string, any>;
}

export class AIVisibilityProviderUnavailableError extends Error {
  constructor(message: string = "AI visibility provider is unavailable or not configured.") {
    super(message);
    this.name = "AIVisibilityProviderUnavailableError";
  }
}

export interface AIVisibilityProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  runPrompt(request: AIVisibilityRequest): Promise<AIVisibilityResponse>;
}

/**
 * Standard AI Visibility Provider implementation.
 * Respects strict NO FAKE DATA policy: if API keys are not supplied,
 * marks provider as unavailable rather than fabricating synthetic observations.
 */
export class ConfiguredAIVisibilityProvider implements AIVisibilityProvider {
  public name: string;
  private apiKey?: string;
  private endpoint?: string;
  private modelName: string;

  constructor(name: string = "openai", modelName: string = "gpt-4o") {
    this.name = name;
    this.modelName = modelName;
    this.apiKey = process.env.AI_VISIBILITY_API_KEY || process.env.OPENAI_API_KEY;
    this.endpoint = process.env.AI_VISIBILITY_ENDPOINT;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  public async runPrompt(request: AIVisibilityRequest): Promise<AIVisibilityResponse> {
    if (!this.apiKey) {
      throw new AIVisibilityProviderUnavailableError(
        `AI visibility engine undefined is not configured with valid API credentials. Real observations must not be fabricated.`
      );
    }

    try {
      const url = this.endpoint || "https://api.openai.com/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: "user", content: request.prompt }],
          temperature: 0.2
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!res.ok) {
        throw new AIVisibilityProviderUnavailableError(`AI provider HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const text = data.choices?.[0]?.message?.content || "";

      return {
        provider: this.name,
        model: this.modelName,
        rawResponse: text,
        timestamp: new Date()
      };
    } catch (err: any) {
      if (err instanceof AIVisibilityProviderUnavailableError) throw err;
      throw new AIVisibilityProviderUnavailableError(`AI visibility execution failed: ${err.message}`);
    }
  }
}

export class AIVisibilityProviderFactory {
  public static getProvider(name: string = "openai"): AIVisibilityProvider {
    return new ConfiguredAIVisibilityProvider(name);
  }
}
