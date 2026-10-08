'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import mainLogo from '../../assets/main logo.png';
import { getImgSrc } from '../../utils/image';
import type { ActiveMenuType } from './navigationData';
import { NavigationTrigger } from './NavigationTrigger';
import { ConversationCTA } from './ConversationCTA';
import { MegaMenu } from './MegaMenu';
import { AIAssistantModal } from '../AIAssistant';
import './BottomNavigation.css';

interface BottomNavigationProps {
  isInsightsPage?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = () => {
  const [activeMenu, setActiveMenu] = useState<ActiveMenuType>(null);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // ROUTE CHANGE RULE: Reset all open menus and AI assistant whenever route changes
  useEffect(() => {
    setActiveMenu(null);
    setIsAiOpen(false);
  }, [pathname]);

  const toggleMenu = (menu: NonNullable<ActiveMenuType>) => {
    // If AI is open, close it when opening a navigation menu
    if (isAiOpen) {
      setIsAiOpen(false);
    }

    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  const toggleAiAssistant = () => {
    // If a mega-menu is open, close it
    if (activeMenu) {
      setActiveMenu(null);
    }
    setIsAiOpen((prev) => !prev);
  };

  const closeAiAssistant = () => {
    setIsAiOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
        closeAiAssistant();
      }
    };

    if (activeMenu || isAiOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [activeMenu, isAiOpen]);

  return (
    <div
      ref={containerRef}
      className={`wk-bottom-nav-root ${activeMenu || isAiOpen ? 'wk-bottom-nav-root--open' : ''}`}
      role="region"
      aria-label="Floating Navigation Dock"
    >
      {/* Expanded Mega Menu Panel */}
      <MegaMenu
        activeMenu={activeMenu}
        onClose={closeMenu}
        onSelectMenu={(menu) => setActiveMenu(menu)}
      />

      {/* Webkorps AI Assistant Modal */}
      <AIAssistantModal isOpen={isAiOpen} onClose={closeAiAssistant} />

      {/* Primary Floating Rounded Bar */}
      <nav
        className="wk-bottom-nav"
        aria-label="Bottom Quick Navigation"
      >
        <div className="wk-bottom-nav__inner">
          {/* Mobile Menu Button (<= 640px) */}
          <button
            type="button"
            className={`wk-bottom-nav__mobile-menu-btn ${activeMenu ? 'wk-bottom-nav__mobile-menu-btn--active' : ''}`}
            onClick={() => toggleMenu(activeMenu || 'services')}
            aria-label={activeMenu ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={!!activeMenu}
          >
            {activeMenu ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
            <span className="wk-bottom-nav__mobile-menu-text">Menu</span>
          </button>

          {/* Webkorps Logo */}
          <a
            href="/"
            className="wk-bottom-nav__brand"
            aria-label="Webkorps Home"
            onClick={(e) => {
              closeMenu();
              closeAiAssistant();
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                e.preventDefault();
                router.push('/');
              }
            }}
          >
            <img
              src={getImgSrc(mainLogo)}
              alt="Webkorps"
              className="wk-bottom-nav__logo"
              width={130}
              height={32}
            />
          </a>

          {/* Tablet Menu Trigger (641px - 880px) */}
          <button
            type="button"
            className={`wk-bottom-nav__tablet-menu-btn ${activeMenu ? 'wk-bottom-nav__tablet-menu-btn--active' : ''}`}
            onClick={() => toggleMenu(activeMenu || 'services')}
            aria-label={activeMenu ? 'Close navigation menu' : 'Explore solutions and services'}
            aria-expanded={!!activeMenu}
          >
            <span>Explore Solutions</span>
            <span className="wk-nav-trigger__icon-wrap" aria-hidden="true">
              {activeMenu ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2" y2="10" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="2" x2="6" y2="10" />
                  <line x1="2" y1="6" x2="10" y2="6" />
                </svg>
              )}
            </span>
          </button>

          {/* Navigation Triggers (> 880px) */}
          <div className="wk-bottom-nav__triggers" role="menubar">
            <NavigationTrigger
              id="trigger-services"
              label="Services"
              isOpen={activeMenu === 'services'}
              controlsId="mega-menu-services"
              onClick={() => toggleMenu('services')}
            />

            <NavigationTrigger
              id="trigger-industries"
              label="Industries"
              isOpen={activeMenu === 'industries'}
              controlsId="mega-menu-industries"
              onClick={() => toggleMenu('industries')}
            />


            <NavigationTrigger
              id="trigger-technologies"
              label="Technologies"
              isOpen={activeMenu === 'technologies'}
              controlsId="mega-menu-technologies"
              onClick={() => toggleMenu('technologies')}
            />

            <NavigationTrigger
              id="trigger-insights"
              label="Insights"
              isOpen={activeMenu === 'insights'}
              controlsId="mega-menu-insights"
              onClick={() => toggleMenu('insights')}
            />
          </div>

          {/* Start the Conversation / AI Assistant CTA */}
          <div className="wk-bottom-nav__action">
            <ConversationCTA
              isOpen={isAiOpen}
              onClick={toggleAiAssistant}
            />
          </div>
        </div>
      </nav>
    </div>
  );
};
