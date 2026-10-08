'use client';

import React from 'react';
import { AIAvatar } from './AIAvatar';

export const TypingIndicator: React.FC = () => {
  return (
    <div
      className="wk-ai-typing-indicator"
      role="status"
      aria-label="Webkorps AI is thinking"
    >
      <AIAvatar size="md" />
      <div className="wk-ai-typing-bubble">
        <span className="wk-ai-typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="wk-ai-typing-dot" style={{ animationDelay: '180ms' }} />
        <span className="wk-ai-typing-dot" style={{ animationDelay: '360ms' }} />
      </div>
    </div>
  );
};
