'use client';

import React, { useRef, useEffect } from 'react';
import type { ChatMessageData } from './types';
import { AIAvatar } from './AIAvatar';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  messages: ChatMessageData[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onClose: () => void;
  onActionClick?: (href: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isTyping,
  onSendMessage,
  onClose,
  onActionClick,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);

  // Track if user is scrolled near bottom
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    // Always scroll if user sent the message or if user is near bottom
    if (lastMsg?.sender === 'user' || isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, isTyping]);

  return (
    <div className="wk-ai-chat-window">
      {/* Chat Window Header */}
      <div className="wk-ai-chat-header">
        <div className="wk-ai-chat-header__info">
          <AIAvatar size="md" />
          <div className="wk-ai-chat-header__text">
            <h3 className="wk-ai-chat-header__title">Webkorps AI</h3>
            <span className="wk-ai-chat-header__status">Always active</span>
          </div>
        </div>

        <button
          type="button"
          className="wk-ai-chat-header__close-btn"
          onClick={onClose}
          aria-label="Close conversation"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scrollable Conversation List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="wk-ai-chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Webkorps conversation messages"
        tabIndex={0}
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onActionClick={onActionClick} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Pinned Bottom Input */}
      <div className="wk-ai-chat-footer">
        <ChatInput onSendMessage={onSendMessage} disabled={isTyping} autoFocus />
      </div>
    </div>
  );
};
