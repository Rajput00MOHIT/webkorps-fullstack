'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Container } from '../../../components/Container/Container';
import { FooterCTA } from './FooterCTA';
import { FooterNav } from './FooterNav';
import { FooterLocations } from './FooterLocations';
import { FooterBottom } from './FooterBottom';
import './Footer.css';

export const Footer: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <footer
      ref={sectionRef}
      id="footer"
      className={`wk-footer ${isVisible ? 'is-visible' : ''}`}
      role="contentinfo"
    >
      <Container size="normal">
        <div className="wk-footer__wrapper">
          {/* Layer 1: Final CTA & Contact/Social Card */}
          <FooterCTA />

          <hr className="wk-footer__divider" />

          {/* Layer 2: 5-Column Global Navigation */}
          <FooterNav />

          <hr className="wk-footer__divider" />

          {/* Layer 3: 5-Column Office Locations */}
          <FooterLocations />

          <hr className="wk-footer__divider" />

          {/* Layer 4: Legal & Copyright Bar */}
          <FooterBottom />
        </div>
      </Container>
    </footer>
  );
};
