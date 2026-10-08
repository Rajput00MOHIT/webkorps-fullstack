import React from 'react';
import './Container.css';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'normal' | 'narrow' | 'wide';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'normal',
  className = '',
  ...props
}) => {
  const sizeClass = size === 'narrow' ? 'site-container-narrow' : size === 'wide' ? 'site-container-wide' : '';
  return (
    <div className={`site-container ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
