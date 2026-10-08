'use client';

import React from 'react';
import type { ExamplePromptItem } from './types';

export const EXAMPLE_PROMPTS: ExamplePromptItem[] = [
  {
    id: 'services',
    text: 'What services does Webkorps offer?',
  },
  {
    id: 'technology',
    text: 'Which technology is right for my project?',
  },
  {
    id: 'cost',
    text: 'How much would my project cost?',
  },
  {
    id: 'ai-solution',
    text: 'Can you help me build an AI-powered solution?',
  },
];

interface ExamplePromptsProps {
  onSelectPrompt: (text: string) => void;
}

export const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="wk-ai-examples">
      <p className="wk-ai-examples__label">Get started with an example below</p>
      <div className="wk-ai-examples__grid">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className="wk-ai-examples__card"
            onClick={() => onSelectPrompt(prompt.text)}
          >
            <span className="wk-ai-examples__card-text">{prompt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
