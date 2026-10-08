'use client';

import React, { useEffect, useRef } from 'react';
import type { ActiveMenuType } from './navigationData';
import { ServicesMenu } from './ServicesMenu';
import { IndustriesMenu } from './IndustriesMenu';
import { TechnologiesMenu } from './TechnologiesMenu';
import { InsightsMenu } from './InsightsMenu';
import { CaseStudiesMenu } from './CaseStudiesMenu';

interface MegaMenuProps {
  activeMenu: ActiveMenuType;
  onClose: () => void;
  onSelectMenu?: (menu: NonNullable<ActiveMenuType>) => void;
}

const MENU_ITEMS = [
  { id: 'services', label: 'Services' },
  { id: 'industries', label: 'Industries' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'technologies', label: 'Technologies' },
  { id: 'insights', label: 'Insights' },
] as const;

export const MegaMenu: React.FC<MegaMenuProps> = ({ activeMenu, onClose, onSelectMenu }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!activeMenu) {
    return null;
  }

  const title =
    activeMenu === 'technologies'
      ? 'Technologies we work on'
      : activeMenu === 'insights'
        ? 'Featured Insights'
        : MENU_ITEMS.find((item) => item.id === activeMenu)?.label || 'Navigation';

  return (
    <div
      id={`mega-menu-${activeMenu}`}
      ref={menuRef}
      className="wk-mega-menu"
      role="region"
      aria-label={`${title} expanded navigation menu`}
    >
      <div className="wk-mega-menu__header">
        <h2 className="wk-mega-menu__title">{title}</h2>
        <button
          type="button"
          className="wk-mega-menu__close-btn"
          onClick={onClose}
          aria-label={`Close ${title} menu`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="wk-mega-menu__content">
        {activeMenu === 'services' && <ServicesMenu onItemClick={onClose} />}
        {activeMenu === 'industries' && <IndustriesMenu onItemClick={onClose} />}
        {activeMenu === 'case-studies' && <CaseStudiesMenu onItemClick={onClose} />}
        {activeMenu === 'technologies' && <TechnologiesMenu onItemClick={onClose} />}
        {activeMenu === 'insights' && <InsightsMenu onItemClick={onClose} />}
      </div>
    </div>
  );
};
