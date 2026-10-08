'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Container } from '../../../components/Container/Container';
import technologyPartnerImg from '../../../assets/Technology Partner/Entrepreneur_giving_positive_fee…_202609081049 1.png';
import { getImgSrc } from '../../../utils/image';
import './NeedPartnerCallout.css';

export const NeedPartnerCallout: React.FC = () => {
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
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="technology-partner"
      className={`wk-tech-partner ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="tech-partner-heading"
    >
      <Container size="wide">
        <div className="wk-tech-partner__card">
          {/* Left Column: Typography & Conversion Action */}
          <div className="wk-tech-partner__content">
            <h2 id="tech-partner-heading" className="wk-tech-partner__title">
              Need the Right
              <br />
              <span className="wk-tech-partner__title-accent">Technology</span>
              <br />
              Partner?
            </h2>

            <p className="wk-tech-partner__subtitle">
              Build faster, innovate smarter, and scale confidently with Webkorps.
            </p>

            <div className="wk-tech-partner__action">
              <a
                href="#contact"
                className="wk-tech-partner__btn"
                aria-label="Let's Talk - Contact Webkorps"
              >
                <span>Let's Talk</span>
                <svg
                  className="wk-tech-partner__btn-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
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

          {/* Right Column: Smartphone Mockup with Circular Glow Backdrop */}
          <div className="wk-tech-partner__phone-wrapper">
            <img
              src={getImgSrc(technologyPartnerImg)}
              alt="Webkorps technology partnership consultation on mobile screen"
              className="wk-tech-partner__phone-img"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default NeedPartnerCallout;
