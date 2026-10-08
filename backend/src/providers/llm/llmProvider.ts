import { ENV } from '../../config/env.js';

export interface LlmGenerationOptions {
  temperature?: number;
  maxTokens?: number;
}

export class LlmProviderManager {
  /**
   * Generates a response using the highest-priority configured LLM provider:
   * 1. Gemini (if GEMINI_API_KEY)
   * 2. OpenAI (if OPENAI_API_KEY)
   * 3. Anthropic (if ANTHROPIC_API_KEY)
   * 4. Ollama (if LOCAL_OLLAMA_URL is reachable)
   * 5. Returns null if no external LLM is configured (delegates to dynamic local reasoner)
   */
  public static async generate(
    systemPrompt: string,
    userPrompt: string,
    options: LlmGenerationOptions = {}
  ): Promise<string | null> {
    // 1. Google Gemini
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ENV.GEMINI_API_KEY.trim()}`;
        const res = await fetch(url, {
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
        });
        if (res.ok) {
          const data: any = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (e) {
        console.warn('[LlmProvider] Gemini call failed, trying next provider:', e);
      }
    }

    // 2. OpenAI
    if (ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim().length > 0) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENV.OPENAI_API_KEY.trim()}`
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
        if (res.ok) {
          const data: any = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        }
      } catch (e) {
        console.warn('[LlmProvider] OpenAI call failed:', e);
      }
    }

    // 3. Local Ollama
    if (ENV.LOCAL_OLLAMA_URL) {
      try {
        const res = await fetch(`${ENV.LOCAL_OLLAMA_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: process.env.LOCAL_LLM_MODEL || 'llama3.1:8b-instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            stream: false
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (res.ok) {
          const data: any = await res.json();
          const text = data?.message?.content;
          if (text) return text.trim();
        }
      } catch {
        // Ollama not running
      }
    }

    return null;
  }
}
