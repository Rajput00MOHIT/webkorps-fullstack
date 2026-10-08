import React from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'brand' | 'subtle' | 'outline' | 'success' | 'dark';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <span
      className={`wk-badge wk-badge--${variant} wk-badge--${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};
