import React from 'react';
import { FOOTER_SOCIAL_LINKS } from './footerData';

export const FooterCTA: React.FC = () => {
  return (
    <div className="wk-footer__top">
      {/* Left: Ready to get started Callout */}
      <div className="wk-footer__cta-col">
        <h3 className="wk-footer__cta-title">Ready to get started?</h3>
        <p className="wk-footer__cta-desc">
          Create an account instantly, or contact us to design a custom package for your business.
        </p>
        <div className="wk-footer__cta-actions">
          <a
            href="#contact"
            className="wk-footer__btn wk-footer__btn--outline"
            aria-label="Contact Sales team"
          >
            Contact Sales
          </a>
          <a
            href="#contact"
            className="wk-footer__btn wk-footer__btn--primary"
            aria-label="Start Now with Webkorps"
          >
            <span>Start Now</span>
            <svg
              className="wk-footer__btn-arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>
      </div>

      {/* Right: Contact Information & Social Card */}
      <div className="wk-footer__card-col">
        <div className="wk-footer__contact-card">
          <div className="wk-footer__contact-info">
            <span className="wk-footer__quote-prompt">
              Click here to get quote or send email to
            </span>
            <div className="wk-footer__email-row">
              <span className="wk-footer__email-prefix">Info</span>{' '}
              <a
                href="mailto:contact@webkorps.com"
                className="wk-footer__email-link"
                aria-label="Send email to contact@webkorps.com"
              >
                contact@webkorps.com
              </a>
            </div>
          </div>

          <div className="wk-footer__social-block">
            <span className="wk-footer__social-heading">Contact us</span>
            <div className="wk-footer__social-icons" role="list">
              {FOOTER_SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wk-footer__social-link"
                  aria-label={social.ariaLabel}
                  role="listitem"
                >
                  {social.icon === 'instagram' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  )}
                  {social.icon === 'linkedin' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  )}
                  {social.icon === 'facebook' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  )}
                  {social.icon === 'x' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
