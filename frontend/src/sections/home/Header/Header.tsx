import React from 'react';
import mainLogo from '../../../assets/main logo.png';
import { getImgSrc } from '../../../utils/image';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="wk-header" role="banner">
      <div className="site-container wk-header__inner">
        {/* Brand Logo */}
        <a href="/" className="wk-header__logo-link" aria-label="Webkorps Home">
          <img
            src={getImgSrc(mainLogo)}
            alt="Webkorps"
            className="wk-header__logo"
            width={160}
            height={40}
          />
        </a>

        {/* Primary Desktop Navigation */}
        <nav className="wk-header__nav" aria-label="Main Navigation">
          <ul className="wk-header__nav-list">
            <li>
              <a href="#about" className="wk-header__nav-link">
                About
              </a>
            </li>
            <li>
              <a href="#case-studies" className="wk-header__nav-link">
                Case Studies
              </a>
            </li>
            <li>
              <a href="#careers" className="wk-header__nav-link">
                Careers
              </a>
            </li>
          </ul>
        </nav>

        {/* Header Right Action CTA */}
        <div className="wk-header__actions">
          <a href="#contact" className="wk-header__contact-btn">
            <span>Contact us</span>
            <svg
              className="wk-header__btn-icon"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3.5 10.5L10.5 3.5M10.5 3.5H4.66667M10.5 3.5V9.33333"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
