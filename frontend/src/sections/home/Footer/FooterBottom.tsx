import React from 'react';
import { FOOTER_LEGAL_LINKS } from './footerData';

export const FooterBottom: React.FC = () => {
  return (
    <div className="wk-footer__bottom">
      <div className="wk-footer__bottom-inner">
        {/* Left: Copyright notice */}
        <p className="wk-footer__copyright">
          © 2026 Webkorps. All rights reserved.
        </p>

        {/* Center: Legal Navigation Links */}
        <nav className="wk-footer__legal-nav" aria-label="Legal Navigation">
          <ul className="wk-footer__legal-list">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <li key={link.label} className="wk-footer__legal-item">
                <a href={link.href} className="wk-footer__legal-link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: Country / Region Indicator */}
        <div className="wk-footer__region">
          <span className="wk-footer__region-text">India</span>
        </div>
      </div>
    </div>
  );
};
