'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Container } from '../../../components/Container/Container';
import { BLOG_POSTS } from './insightsData';
import { BlogCarousel } from './BlogCarousel';
import './Insights.css';

export const Insights: React.FC = () => {
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
      id="insights"
      className={`wk-insights ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="insights-heading"
    >
      <Container size="wide">
        {/* Section Header: Title & View All Link */}
        <div className="wk-insights__header">
          <h2 id="insights-heading" className="wk-insights__title">
            Explore Blogs, insights, and
            <br />
            stories <span className="wk-insights__title-accent">shaping the future.</span>
          </h2>

          <div className="wk-insights__action">
            <a
              href="#insights"
              className="wk-insights__view-all"
              aria-label="View all blogs and insights"
            >
              <span>View all</span>
              <span className="wk-insights__view-all-chevron" aria-hidden="true">
                &raquo;
              </span>
            </a>
          </div>
        </div>

        {/* Horizontal Blog Carousel */}
        <BlogCarousel posts={BLOG_POSTS} />
      </Container>
    </section>
  );
};

export default Insights;
