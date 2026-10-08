'use client';

import React from 'react';
import { AIAvatar } from './AIAvatar';
import { ChatInput } from './ChatInput';
import { ExamplePrompts } from './ExamplePrompts';

interface AIWelcomeProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const AIWelcome: React.FC<AIWelcomeProps> = ({ onSendMessage, disabled = false }) => {
  return (
    <div className="wk-ai-welcome">
      <div className="wk-ai-welcome__avatar-wrap">
        <AIAvatar size="lg" />
      </div>

      <div className="wk-ai-welcome__header">
        <h2 className="wk-ai-welcome__greeting">Hi there,</h2>
        <h3 className="wk-ai-welcome__question">
          What’s on <span className="wk-ai-welcome__accent">your mind?</span>
        </h3>
      </div>

      <div className="wk-ai-welcome__input-box">
        <ChatInput onSendMessage={onSendMessage} disabled={disabled} autoFocus />
      </div>

      <div className="wk-ai-welcome__examples-box">
        <ExamplePrompts onSelectPrompt={onSendMessage} />
      </div>
    </div>
  );
};
