import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'elevated' | 'glass';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const classes = [
    'wk-card',
    `wk-card--${variant}`,
    `wk-card--pad-${padding}`,
    interactive ? 'wk-card--interactive' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
