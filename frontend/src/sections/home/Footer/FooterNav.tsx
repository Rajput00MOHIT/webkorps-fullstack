import React from 'react';
import { FOOTER_NAV_GROUPS } from './footerData';

export const FooterNav: React.FC = () => {
  return (
    <nav className="wk-footer__nav" aria-label="Footer Navigation">
      <div className="wk-footer__nav-grid">
        {FOOTER_NAV_GROUPS.map((group, index) => (
          <div
            key={group.title}
            className={`wk-footer__nav-col ${index < FOOTER_NAV_GROUPS.length - 1 ? 'wk-footer__nav-col--bordered' : ''}`}
          >
            <h4 className="wk-footer__nav-title">{group.title}</h4>
            <ul className="wk-footer__nav-list">
              {group.links.map((link) => (
                <li key={link.label} className="wk-footer__nav-item">
                  <a href={link.href} className="wk-footer__nav-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
};
