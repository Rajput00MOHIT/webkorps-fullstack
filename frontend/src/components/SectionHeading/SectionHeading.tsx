import React from 'react';
import './SectionHeading.css';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  highlightText?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  level?: 2 | 3;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  highlightText,
  subtitle,
  align = 'center',
  action,
  level = 2,
  className = ''
}) => {
  const HeadingTag = level === 3 ? 'h3' : 'h2';

  return (
    <div className={`wk-section-heading wk-section-heading--${align} ${className}`.trim()}>
      <div className="wk-section-heading__content">
        {eyebrow && <span className="wk-section-heading__eyebrow">{eyebrow}</span>}
        <HeadingTag className="wk-section-heading__title">
          {title}{' '}
          {highlightText && (
            <span className="wk-section-heading__highlight text-gradient-brand">
              {highlightText}
            </span>
          )}
        </HeadingTag>
        {subtitle && <p className="wk-section-heading__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="wk-section-heading__action">{action}</div>}
    </div>
  );
};
