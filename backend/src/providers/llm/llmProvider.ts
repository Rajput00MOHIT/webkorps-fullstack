import { ENV } from '../../config/env.js';

const isNonEmpty = (value?: string) => Boolean(value && value.trim().length > 0);

export interface LlmGenerationOptions {
  temperature?: number;
  maxTokens?: number;
}

export class LlmProviderManager {
  /**
   * Priority: Local Ollama first (free/local), then optional OpenAI/Gemini if configured.
   * Returns null when no local or remote provider is configured.
   */
  public static async generate(
    systemPrompt: string,
    userPrompt: string,
    options: LlmGenerationOptions = {}
  ): Promise<string | null> {
    if (!systemPrompt && !userPrompt) {
      return null;
    }

    const providerMode = ENV.ASSISTANT_PROVIDER || 'local';
    const localModel = ENV.LOCAL_LLM_MODEL || process.env.LOCAL_LLM_MODEL || 'llama3.1:8b-instruct';
    const orderedProviders =
      providerMode === 'openai'
        ? ['openai']
        : providerMode === 'gemini'
          ? ['gemini']
          : providerMode === 'anthropic'
            ? ['anthropic']
            : ['local', 'openai', 'gemini'];

    for (const provider of orderedProviders) {
      if (provider === 'local') {
        if (!ENV.LOCAL_OLLAMA_URL) continue;
        try {
          const response = await fetch(`${ENV.LOCAL_OLLAMA_URL.replace(/\/$/, '')}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: localModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              stream: false,
              options: {
                temperature: options.temperature ?? 0.3,
                num_predict: options.maxTokens ?? 1200
              }
            }),
            signal: AbortSignal.timeout(15000)
          });

          if (!response.ok) continue;

          const data: any = await response.json();
          const text = data?.message?.content || data?.content?.[0]?.text;
          if (text && typeof text === 'string' && text.trim().length > 0) {
            return text.trim();
          }
        } catch {
          // Local model not running; continue to other providers.
        }
      }

      if (provider === 'openai') {
        if (!isNonEmpty(ENV.OPENAI_API_KEY)) continue;
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${ENV.OPENAI_API_KEY.trim()}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: options.temperature ?? 0.3,
              max_tokens: options.maxTokens ?? 1200
            }),
            signal: AbortSignal.timeout(10000)
          });

          if (!response.ok) continue;

          const data: any = await response.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text && text.trim().length > 0) {
            return text.trim();
          }
        } catch {
          // OpenAI unavailable; continue to next configured provider.
        }
      }

      if (provider === 'gemini') {
        if (!isNonEmpty(ENV.GEMINI_API_KEY)) continue;
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                  temperature: options.temperature ?? 0.3,
                  maxOutputTokens: options.maxTokens ?? 1200
                }
              }),
              signal: AbortSignal.timeout(10000)
            }
          );

          if (!response.ok) continue;

          const data: any = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 0) {
            return text.trim();
          }
        } catch {
          // Gemini unavailable; continue.
        }
      }
    }

    return null;
  }
}
