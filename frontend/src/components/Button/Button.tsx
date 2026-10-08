import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  iconLeading?: React.ReactNode;
  iconTrailing?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconLeading,
  iconTrailing,
  href,
  target,
  rel,
  className = '',
  disabled,
  ...props
}) => {
  const classes = [
    'wk-btn',
    `wk-btn--${variant}`,
    `wk-btn--${size}`,
    fullWidth ? 'wk-btn--full' : '',
    disabled ? 'wk-btn--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  // Semantic Link rendering
  if (href && !disabled) {
    return (
      <a
        href={href}
        className={classes}
        target={target}
        rel={target === '_blank' ? (rel || 'noopener noreferrer') : rel}
      >
        {iconLeading && <span className="wk-btn__icon wk-btn__icon--leading">{iconLeading}</span>}
        <span className="wk-btn__text">{children}</span>
        {iconTrailing && <span className="wk-btn__icon wk-btn__icon--trailing">{iconTrailing}</span>}
      </a>
    );
  }

  // Semantic Button rendering
  return (
    <button
      type={props.type || 'button'}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {iconLeading && <span className="wk-btn__icon wk-btn__icon--leading">{iconLeading}</span>}
      <span className="wk-btn__text">{children}</span>
      {iconTrailing && <span className="wk-btn__icon wk-btn__icon--trailing">{iconTrailing}</span>}
    </button>
  );
};
