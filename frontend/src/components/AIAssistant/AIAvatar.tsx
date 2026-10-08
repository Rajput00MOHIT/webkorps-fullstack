'use client';

import React from 'react';
import avatarCenter from '../../assets/ai/avatar-center.png';
import { getImgSrc } from '../../utils/image';

interface AIAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alt?: string;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  size = 'md',
  className = '',
  alt = 'Webkorps AI Assistant',
}) => {
  const pixelSizes = {
    sm: 22,
    md: 34,
    lg: 64,
  };

  const px = pixelSizes[size];

  return (
    <div
      className={`wk-ai-avatar wk-ai-avatar--${size} ${className}`}
      style={{ width: `${px}px`, height: `${px}px` }}
      aria-hidden="true"
    >
      <img
        src={getImgSrc(avatarCenter)}
        alt={alt}
        className="wk-ai-avatar__img"
        width={px}
        height={px}
      />
    </div>
  );
};
