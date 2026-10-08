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
      {/* Top AI Avatar */}
      <div className="wk-ai-welcome__avatar-wrap">
        <AIAvatar size="lg" />
      </div>

      {/* Greeting Title */}
      <div className="wk-ai-welcome__header">
        <h2 className="wk-ai-welcome__greeting">Good Afternoon Riva,</h2>
        <h3 className="wk-ai-welcome__question">
          What’s on <span className="wk-ai-welcome__accent">Your Mind?</span>
        </h3>
      </div>

      {/* Center Input Form */}
      <div className="wk-ai-welcome__input-box">
        <ChatInput onSendMessage={onSendMessage} disabled={disabled} autoFocus />
      </div>

      {/* Example Question Cards */}
      <div className="wk-ai-welcome__examples-box">
        <ExamplePrompts onSelectPrompt={onSendMessage} />
      </div>
    </div>
  );
};
