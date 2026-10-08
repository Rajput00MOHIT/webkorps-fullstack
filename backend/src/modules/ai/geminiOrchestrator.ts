import { ENV } from '../../config/env.js';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiResponse {
  text: string;
  totalTokens?: number;
  model: string;
}

export class GeminiOrchestrator {
  private static readonly DEFAULT_MODEL = 'gemini-1.5-flash';

  public static getApiKey(): string {
    return (ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  }

  public static isConfigured(): boolean {
    return this.getApiKey().length > 0;
  }

  /**
   * Generates grounded content using Google Gemini API
   */
  public static async generateContent(
    systemInstruction: string,
    prompt: string,
    modelName: string = this.DEFAULT_MODEL
  ): Promise<GeminiResponse> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('GEMINI_API_KEY is not set. Please set GEMINI_API_KEY in your .env file.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;

    const body = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    const totalTokens = data.usageMetadata?.totalTokenCount;

    return {
      text: text.trim(),
      totalTokens,
      model: modelName
    };
  }

  /**
   * Generates training / evaluation pairs from a raw knowledge chunk using Gemini
   */
  public static async generateSyntheticTrainingPairs(
    chunkTitle: string,
    chunkText: string
  ): Promise<Array<{ question: string; answer: string; category: string }>> {
    const systemPrompt = `You are an elite AI training dataset engineer for Webkorps.
Your task is to generate 3 realistic, high-value customer questions (in English and Hinglish) and grounded, professional, Claude-quality answers based STRICTLY on the provided knowledge chunk.
Output ONLY a valid JSON array of objects with the structure:
[
  {
    "question": "string",
    "answer": "string",
    "category": "SERVICES | TECH | CASE_STUDY | PRICING | HINGLISH"
  }
]`;

    const userPrompt = `Knowledge Chunk Title: ${chunkTitle}
Content:
${chunkText}

Generate 3 high-quality training pairs in JSON:`;

    try {
      const resp = await this.generateContent(systemPrompt, userPrompt);
      const cleaned = resp.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.warn(`[GeminiOrchestrator] Synthetic generation fallback:`, e.message);
      return [];
    }
  }
}
