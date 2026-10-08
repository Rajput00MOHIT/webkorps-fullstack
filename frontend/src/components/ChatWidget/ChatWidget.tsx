import { useEffect, useRef, useState } from 'react';
import './ChatWidget.css';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

function createLocalAssistantReply(question: string): string {
  const q = question.toLowerCase();

  if (/(pricing|cost|budget|quote|price|how much)/.test(q)) {
    return 'Webkorps offers flexible engagement models for dedicated squads, product engineering, and consulting. The best fit depends on scope, timeline, and team access. You can request a quote through the contact form or book a discovery call with our team.';
  }

  if (/(service|services|software|mobile|web|ai|ml|cloud|devops)/.test(q)) {
    return 'Webkorps helps businesses with custom software, web and mobile app development, AI/ML engineering, cloud & DevOps, enterprise integrations, and digital transformation. If you share your project goals, we can suggest the right solution path.';
  }

  if (/(industry|healthcare|fintech|logistics|retail|education|supply)/.test(q)) {
    return 'Webkorps works across healthcare, fintech, logistics, education, retail, and enterprise digital transformation. The right solution usually starts with understanding the business workflow, data, and growth goals.';
  }

  if (/(contact|talk|consult|schedule|book|call)/.test(q)) {
    return 'You can connect with Webkorps through the contact form on this page, or contact the team directly at contact@webkorps.com. A discovery call is the fastest way to map your requirements and recommend the right engagement model.';
  }

  if (/(who|what is webkorps|about webkorps)/.test(q)) {
    return 'Webkorps is an enterprise digital engineering company focused on custom software, AI-driven product engineering, cloud systems, and digital growth. The team helps businesses move from idea to production with measurable impact.';
  }

  return 'Webkorps helps companies design, build, and scale digital products, AI workflows, and enterprise engineering systems. Tell me your business challenge, target industry, or project goal and I can guide the right path.';
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help with Webkorps services, pricing, project ideas, and the right engineering approach. Ask me anything.'
    }
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed
    };

    const thinkingId = `thinking-${Date.now()}`;
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, { id: thinkingId, role: 'assistant', text: 'Thinking...' }]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/v1/conversations/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId: 'webkorps-website-chat'
        })
      });

      if (!response.ok) {
        throw new Error(`Assistant request failed with status ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.answer || data?.message?.text || createLocalAssistantReply(trimmed);

      setMessages((prev) => [
        ...prev.filter((message) => message.id !== thinkingId),
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: answer
        }
      ]);
    } catch (error) {
      const fallbackReply = createLocalAssistantReply(trimmed);
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== thinkingId),
        {
          id: `assistant-fallback-${Date.now()}`,
          role: 'assistant',
          text: fallbackReply
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="chat-widget">
      <button
        type="button"
        className="chat-widget__toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? '×' : 'Ask AI'}
      </button>

      {isOpen && (
        <div className="chat-widget__panel" role="dialog" aria-label="Webkorps AI assistant">
          <div className="chat-widget__header">
            <div>
              <strong>Webkorps AI</strong>
              <span>Free local assistant</span>
            </div>
          </div>

          <div className="chat-widget__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-widget__message chat-widget__message--${message.role}`}
              >
                {message.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-widget__composer">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a project or service..."
              disabled={isSending}
            />
            <button type="button" onClick={() => void handleSend()} disabled={isSending}>
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
