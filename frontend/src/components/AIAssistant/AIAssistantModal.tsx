'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ChatMessageData } from './types';
import { mockAiResponse } from './mockAiEngine';
import { sendChatMessage } from '../../lib/api';
import { AIWelcome } from './AIWelcome';
import { ChatWindow } from './ChatWindow';
import './AIAssistant.css';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessageData = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const apiResult = await sendChatMessage(text, conversationId);
      if (apiResult && apiResult.message) {
        setConversationId(apiResult.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: apiResult.message.id,
            sender: apiResult.message.sender,
            text: apiResult.message.text,
            timestamp: apiResult.message.timestamp,
            actions: apiResult.message.actions as any,
            citations: apiResult.message.citations,
            route: apiResult.message.route,
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch {
      // Fall through to fallback engine
    }

    // Resilient local fallback engine
    setTimeout(() => {
      const response = mockAiResponse(text);
      const aiMsg: ChatMessageData = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        timestamp: Date.now(),
        actions: response.actions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Full-screen light blue dotted background behind AI Conversation surface */}
      {mounted &&
        createPortal(
          <div
            className="wk-ai-backdrop"
            onClick={onClose}
            aria-hidden="true"
          />,
          document.body
        )}

      <div
        ref={containerRef}
        className="wk-ai-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Webkorps AI Assistant"
      >
        <div className="wk-ai-modal__card">
          {messages.length === 0 ? (
            <AIWelcome onSendMessage={handleSendMessage} disabled={isTyping} />
          ) : (
            <ChatWindow
              messages={messages}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
              onClose={onClose}
              onActionClick={() => onClose()}
            />
          )}
        </div>
      </div>
    </>
  );
};
