'use client';

import React from 'react';
import { AIAvatar } from '../AIAssistant/AIAvatar';

interface ConversationCTAProps {
  isOpen?: boolean;
  onClick: () => void;
  className?: string;
}

export const ConversationCTA: React.FC<ConversationCTAProps> = ({
  isOpen = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      id="trigger-ai-assistant"
      type="button"
      className={`wk-bottom-nav__cta ${isOpen ? 'wk-bottom-nav__cta--open' : ''} ${className}`}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={isOpen ? 'Close Webkorps AI conversation' : 'Start the Conversation with Webkorps AI Assistant'}
    >
      <span className="wk-bottom-nav__cta-icon-wrap" aria-hidden="true">
        {isOpen ? (
          <span className="wk-bottom-nav__cta-close-circle">
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              stroke="#1887C9"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </span>
        ) : (
          <AIAvatar size="sm" className="wk-bottom-nav__cta-avatar" />
        )}
      </span>

      <span className="wk-bottom-nav__cta-text">Start the Conversation</span>
      <span className="wk-bottom-nav__cta-text-mobile">Start</span>
    </button>
  );
};
