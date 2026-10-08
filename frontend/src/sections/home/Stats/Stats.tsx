'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container } from '../../../components/Container/Container';
import { getImgSrc } from '../../../utils/image';
import mapImg from '../../../assets/Map_image.png';
import './Stats.css';

interface StatItem {
  id: string;
  targetNum: number;
  formatLeadingZero: boolean;
  label: string;
}

const STATS_DATA: StatItem[] = [
  {
    id: 'years-in-business',
    targetNum: 8,
    formatLeadingZero: true,
    label: 'Years in Business',
  },
  {
    id: 'clients-served',
    targetNum: 150,
    formatLeadingZero: false,
    label: 'Clients Served',
  },
  {
    id: 'projects-delivered',
    targetNum: 180,
    formatLeadingZero: false,
    label: 'Projects Delivered',
  },
];

export const Stats: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState<number[]>([0, 0, 0]);

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
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const frameId = requestAnimationFrame(() => {
        setCounts(STATS_DATA.map((s) => s.targetNum));
      });
      return () => cancelAnimationFrame(frameId);
    }

    const duration = 1200; // ms snappy count-up
    const startTime = performance.now();

    const updateCounts = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setCounts(STATS_DATA.map((s) => Math.round(s.targetNum * easeProgress)));

      if (progress < 1) {
        requestAnimationFrame(updateCounts);
      } else {
        setCounts(STATS_DATA.map((s) => s.targetNum));
      }
    };

    const animId = requestAnimationFrame(updateCounts);
    return () => cancelAnimationFrame(animId);
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      className={`wk-stats ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="stats-heading"
    >
      <Container>
        <div className="wk-stats__header">
          <h2 id="stats-heading" className="wk-stats__title">
            Every Number<br />
            <span className="wk-stats__title-accent">Holds a Story</span>
          </h2>
        </div>

        <div className="wk-stats__container">
          <img
            src={getImgSrc(mapImg)}
            alt=""
            className="wk-stats__map-bg"
            aria-hidden="true"
          />
          {STATS_DATA.map((stat, index) => {
            const displayValue = stat.formatLeadingZero
              ? String(counts[index]).padStart(2, '0')
              : String(counts[index]);

            return (
              <React.Fragment key={stat.id}>
                {index > 0 && (
                  <div
                    className="wk-stats__separator"
                    aria-hidden="true"
                    role="separator"
                  />
                )}
                <article
                  className={`wk-stats__item ${isVisible ? 'wk-stats__item--visible' : ''}`}
                  style={{
                    transitionDelay: `${index * 140}ms`,
                  }}
                  aria-label={`${stat.formatLeadingZero ? String(stat.targetNum).padStart(2, '0') : stat.targetNum} ${stat.label}`}
                >
                  <div
                    className="wk-stats__number"
                    aria-hidden="true"
                  >
                    {displayValue}
                  </div>
                  <p className="wk-stats__label">{stat.label}</p>
                </article>
              </React.Fragment>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

