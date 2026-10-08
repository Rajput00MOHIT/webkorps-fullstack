'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { BlogPost } from './insightsData';
import { BlogCard } from './BlogCard';

interface BlogCarouselProps {
  posts: BlogPost[];
}

export const BlogCarousel: React.FC<BlogCarouselProps> = ({ posts }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<number>(50);
  const [isAtStart, setIsAtStart] = useState<boolean>(true);
  const [isAtEnd, setIsAtEnd] = useState<boolean>(false);

  const updateProgress = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 5) {
      setProgress(100);
      setIsAtStart(true);
      setIsAtEnd(true);
      return;
    }

    setIsAtStart(scrollLeft <= 5);
    setIsAtEnd(scrollLeft >= maxScroll - 5);

    // Calculate visible coverage: at start it represents visible cards (e.g. 50%), expanding to 100% at end
    const visibleRatio = clientWidth / scrollWidth;
    const scrollRatio = scrollLeft / maxScroll;
    const currentProgress = (visibleRatio + (1 - visibleRatio) * scrollRatio) * 100;

    setProgress(Math.min(100, Math.max(15, currentProgress)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateProgress();
    el.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      el.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [updateProgress]);

  const handlePrev = () => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>('.wk-blog-card');
    const scrollAmount = card ? card.offsetWidth + 24 : el.clientWidth * 0.5;

    el.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleNext = () => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector<HTMLElement>('.wk-blog-card');
    const scrollAmount = card ? card.offsetWidth + 24 : el.clientWidth * 0.5;

    el.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="wk-blog-carousel" aria-label="Blog and insights carousel">
      {/* Scrollable Track Viewport */}
      <div
        ref={trackRef}
        className="wk-blog-carousel__viewport"
        tabIndex={0}
        role="region"
        aria-label="Blog posts carousel track, use arrow keys to navigate"
      >
        <div className="wk-blog-carousel__track">
          {posts.map((post, index) => (
            <div
              key={`${post.id}-${index}`}
              className="wk-blog-carousel__slide"
              style={{ transitionDelay: `${index * 120}ms` }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${posts.length}`}
            >
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls: Progress Indicator & Previous/Next Buttons */}
      <div className="wk-blog-carousel__footer">
        {/* Visual Progress Bar Track */}
        <div
          className="wk-blog-carousel__progress-bar"
          role="progressbar"
          aria-label="Blog carousel progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="wk-blog-carousel__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Previous and Next Navigation Arrow Controls */}
        <div className="wk-blog-carousel__controls">
          <button
            type="button"
            className="wk-blog-carousel__nav-btn"
            onClick={handlePrev}
            disabled={isAtStart}
            aria-label="Previous blog cards"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
            className="wk-blog-carousel__nav-btn"
            onClick={handleNext}
            disabled={isAtEnd}
            aria-label="Next blog cards"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
    </div>
  );
};
