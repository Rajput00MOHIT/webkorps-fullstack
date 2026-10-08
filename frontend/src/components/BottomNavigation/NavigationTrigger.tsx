'use client';

import React from 'react';

interface NavigationTriggerProps {
  id: string;
  label: string;
  isOpen: boolean;
  controlsId: string;
  onClick: () => void;
  className?: string;
}

export const NavigationTrigger: React.FC<NavigationTriggerProps> = ({
  id,
  label,
  isOpen,
  controlsId,
  onClick,
  className = '',
}) => {
  return (
    <button
      id={id}
      type="button"
      className={`wk-nav-trigger ${isOpen ? 'wk-nav-trigger--active' : ''} ${className}`}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      aria-haspopup="dialog"
    >
      <span className="wk-nav-trigger__label">{label}</span>
      <span className="wk-nav-trigger__icon-wrap" aria-hidden="true">
        {isOpen ? (
          <svg
            className="wk-nav-trigger__icon wk-nav-trigger__icon--close"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
          </svg>
        ) : (
          <svg
            className="wk-nav-trigger__icon wk-nav-trigger__icon--plus"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="6" y1="2" x2="6" y2="10" />
            <line x1="2" y1="6" x2="10" y2="6" />
          </svg>
        )}
      </span>
    </button>
  );
};
