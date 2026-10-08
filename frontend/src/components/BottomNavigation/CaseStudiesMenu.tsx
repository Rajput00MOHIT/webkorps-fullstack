'use client';

import React from 'react';
import { CASE_STUDIES_NAV_DATA } from './navigationData';

interface CaseStudiesMenuProps {
  onItemClick?: () => void;
}

export const CaseStudiesMenu: React.FC<CaseStudiesMenuProps> = ({ onItemClick }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (onItemClick) {
      onItemClick();
    }
    if (href.startsWith('#')) {
      const targetId = href.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="wk-mega-menu__generic">
      <div className="wk-mega-menu__generic-grid wk-mega-menu__generic-grid--2col">
        {CASE_STUDIES_NAV_DATA.map((study, idx) => (
          <a
            key={study.id}
            href={study.href}
            className="wk-mega-menu__item wk-mega-menu__item--card"
            onClick={(e) => handleLinkClick(e, study.href)}
            style={{ '--item-stagger': `${idx * 40}ms` } as React.CSSProperties}
          >
            <div className="wk-mega-menu__item-content">
              <div className="wk-mega-menu__insight-meta">
                <span className="wk-mega-menu__category-tag">{study.category}</span>
                <span className="wk-mega-menu__read-time" style={{ color: '#0066FF', fontWeight: 600 }}>
                  {study.client}
                </span>
              </div>
              <span className="wk-mega-menu__item-title">{study.title}</span>
              <p className="wk-mega-menu__item-desc">{study.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
