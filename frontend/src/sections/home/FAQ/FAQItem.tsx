import React from 'react';
import type { FAQItemData } from './faqData';

interface FAQItemProps {
  item: FAQItemData;
  isOpen: boolean;
  onToggle: () => void;
}

export const FAQItem: React.FC<FAQItemProps> = ({ item, isOpen, onToggle }) => {
  const triggerId = `faq-trigger-${item.id}`;
  const answerId = `faq-answer-${item.id}`;

  return (
    <div className={`wk-faq-item ${isOpen ? 'wk-faq-item--expanded' : ''}`}>
      <button
        id={triggerId}
        type="button"
        className="wk-faq-item__trigger"
        aria-expanded={isOpen}
        aria-controls={answerId}
        onClick={onToggle}
      >
        <span className="wk-faq-item__question">{item.question}</span>
        <span className="wk-faq-item__icon-wrapper" aria-hidden="true">
          <svg
            className={`wk-faq-item__icon ${isOpen ? 'wk-faq-item__icon--minus' : 'wk-faq-item__icon--plus'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Horizontal line for both plus and minus */}
            <line x1="5" y1="12" x2="19" y2="12" />
            {/* Vertical line that fades / shrinks out when expanded */}
            <line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
              className="wk-faq-item__icon-vertical"
            />
          </svg>
        </span>
      </button>

      <div
        id={answerId}
        role="region"
        aria-labelledby={triggerId}
        className="wk-faq-item__panel"
      >
        <div className="wk-faq-item__content">
          {item.isApproved ? (
            <p className="wk-faq-item__answer">{item.answer}</p>
          ) : (
            <div className="wk-faq-item__pending-box">
              <p className="wk-faq-item__answer wk-faq-item__answer--pending">
                {item.answer}
              </p>
              <span className="wk-faq-item__pending-badge">Pending Client Confirmation</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
