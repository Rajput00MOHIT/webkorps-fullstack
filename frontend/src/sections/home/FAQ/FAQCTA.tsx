import React from 'react';

export const FAQCTA: React.FC = () => {
  return (
    <div className="wk-faq-cta">
      <h3 className="wk-faq-cta__title">Still have question?</h3>
      <p className="wk-faq-cta__desc">
        Can’t find what you’re looking for? Our team is here to help you with clear answers and quick guidance.
      </p>
      <a
        href="#contact"
        className="wk-faq-cta__btn"
        aria-label="Book a Consultation with Webkorps"
      >
        <span>Book a Consultation</span>
        <svg
          className="wk-faq-cta__btn-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </a>
    </div>
  );
};
