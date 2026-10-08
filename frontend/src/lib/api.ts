/**
 * API client to connect the Webkorps frontend to the Corp Talk backend.
 * Provides resilient fallbacks so the UI remains functional even if offline.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '/api/v1';

export interface ChatApiResponse {
  conversationId: string;
  message: {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: number;
    actions?: Array<{
      label: string;
      href: string;
      variant?: 'primary' | 'secondary';
    }>;
    citations?: Array<{
      title: string;
      url: string;
      domain?: string;
      snippet?: string;
    }>;
    route?: string;
  };
}

export async function sendChatMessage(
  text: string,
  conversationId?: string
): Promise<ChatApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/conversations/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, conversationId }),
    });

    if (!res.ok) {
      throw new Error(`Chat API error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('[Corp Talk Backend] Chat API request failed, using local fallback:', err);
    return null;
  }
}

export interface LeadSubmissionPayload {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

export interface LeadSubmissionResponse {
  success: boolean;
  leadId: string;
  message: string;
}

export async function submitLead(
  payload: LeadSubmissionPayload
): Promise<LeadSubmissionResponse> {
  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Lead submission failed: ${res.status}`);
  }

  return await res.json();
}

export async function sendAnalyticsTelemetry(event: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${API_BASE}/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch {
    // Non-blocking telemetry
  }
}
