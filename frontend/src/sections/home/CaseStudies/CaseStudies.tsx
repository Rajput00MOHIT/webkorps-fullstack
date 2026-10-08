'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Container } from '../../../components/Container/Container';
import { CaseStudyCard } from './CaseStudyCard';
import { CASE_STUDIES_DATA } from './caseStudiesData';
import './CaseStudies.css';

export const CaseStudies: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(50);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

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

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 4) {
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const currentScroll = track.scrollLeft;
    const scrollRatio = Math.min(1, Math.max(0, currentScroll / maxScroll));
    const visibleRatio = Math.min(1, track.clientWidth / track.scrollWidth);
    const minProgress = Math.max(25, visibleRatio * 100);
    const calculatedProgress = Math.min(100, Math.max(minProgress, minProgress + scrollRatio * (100 - minProgress)));
    setScrollProgress(calculatedProgress);

    setCanScrollLeft(currentScroll > 8);
    setCanScrollRight(currentScroll < maxScroll - 8);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();
    track.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });

    return () => {
      track.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const handleScroll = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>('.wk-case-study-card');
    const scrollDistance = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;

    track.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth',
    });
  };

  return (
    <section
      ref={sectionRef}
      id="case-studies"
      className={`wk-case-studies ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="case-studies-heading"
    >
      <Container size="wide">
        {/* Section Top / Heading & View All CTA */}
        <div className="wk-case-studies__top">
          <div className="wk-case-studies__heading-group">
            <h2 id="case-studies-heading" className="wk-case-studies__title">
              Industry-focused solutions for
              <span className="wk-case-studies__title-accent">
                real business challenges
              </span>
            </h2>
          </div>

          <a
            href="#case-studies"
            className="wk-case-studies__view-all"
            aria-label="View all case studies"
          >
            View all
            <span className="wk-case-studies__view-all-arrow" aria-hidden="true">
              &gt;&gt;
            </span>
          </a>
        </div>

        {/* Case Study Cards Carousel/Grid */}
        <div
          ref={trackRef}
          className="wk-case-studies__track"
          tabIndex={0}
          aria-label="Case studies list"
        >
          {CASE_STUDIES_DATA.map((study, index) => (
            <CaseStudyCard
              key={study.id}
              caseStudy={study}
              style={{ transitionDelay: `${index * 120}ms` }}
            />
          ))}
        </div>

        {/* Bottom Navigation Track Bar & Action Arrows */}
        <div className="wk-case-studies__bottom-nav" aria-hidden="false">
          <div
            className="wk-case-studies__progress-track"
            role="progressbar"
            aria-label="Case studies reading progress"
            aria-valuenow={Math.round(scrollProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="wk-case-studies__progress-fill"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          <div className="wk-case-studies__nav-controls">
            <button
              type="button"
              className={`wk-case-studies__nav-btn ${
                !canScrollLeft ? 'wk-case-studies__nav-btn--disabled' : ''
              }`}
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous case study"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            <button
              type="button"
              className={`wk-case-studies__nav-btn ${
                !canScrollRight ? 'wk-case-studies__nav-btn--disabled' : ''
              }`}
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next case study"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
};
