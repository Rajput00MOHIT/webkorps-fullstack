'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '../../../components/Container/Container';
import chiragPhoto from '../../../assets/leadership/Chirag.png';
import amulPhoto from '../../../assets/leadership/amul.png';
import parakhPhoto from '../../../assets/leadership/parakh.png';
import swapnilPhoto from '../../../assets/leadership/swapnil.png';
import ankurPhoto from '../../../assets/leadership/ankur.png';
import vikasPhoto from '../../../assets/leadership/vikas.png';
import mehulPhoto from '../../../assets/leadership/mehul.png';
import aakashPhoto from '../../../assets/leadership/aakash.png';
import ajayPhoto from '../../../assets/leadership/ajay.png';
import { getImgSrc } from '../../../utils/image';
import './Leadership.css';

interface LeaderItem {
  id: string;
  name: string;
  title: string;
  quote: string;
  image: string | any;
  imageAlt: string;
  linkedinUrl: string;
  emailUrl: string;
}

const LEADERS_DATA: LeaderItem[] = [
  {
    id: 'chirag-agrawal',
    name: 'Chirag Agrawal',
    title: 'CEO & Founder',
    quote:
      'Success is not about being ahead of others, it’s about becoming better than who you were yesterday.',
    image: chiragPhoto,
    imageAlt: 'Chirag Agrawal, CEO & Founder at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'amul-choudhary',
    name: 'Amul Choudhary',
    title: 'COO & Co-Founder',
    quote:
      'Keep learning, keep growing, and keep moving forward because every small step creates a bigger journey.',
    image: amulPhoto,
    imageAlt: 'Amul Choudhary, COO & Co-Founder at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'parakh-garg',
    name: 'Parakh Garg',
    title: 'CTO',
    quote:
      'Challenges may slow you down, but never let them stop you. Every struggle is preparing you for something greater.',
    image: parakhPhoto,
    imageAlt: 'Parakh Garg, CTO at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'swapnil-bhosle',
    name: 'Swapnil Bhosle',
    title: 'Vice President of Engineering',
    quote:
      'Success shines brighter when it is earned with honesty, and becomes meaningful when it inspires others.',
    image: swapnilPhoto,
    imageAlt: 'Swapnil Bhosle, Vice President of Engineering at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'ankur-singhal',
    name: 'Ankur Singhal',
    title: 'Chief Growth Officer',
    quote:
      'Be the reason someone believes in possibilities, and leave every place better than you found it.',
    image: ankurPhoto,
    imageAlt: 'Ankur Singhal, Chief Growth Officer at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'vikas-dameriya',
    name: 'Vikas Dameriya',
    title: 'Vice President of Business',
    quote:
      'Dream big, work hard, and stay humble, because true success is built one step at a time.',
    image: vikasPhoto,
    imageAlt: 'Vikas Dameriya, Vice President of Business at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'mehul-shah',
    name: 'Mehul Shah',
    title: 'Head of Operations',
    quote:
      'Don’t wait for the perfect moment to begin, make the moment perfect with your effort.',
    image: mehulPhoto,
    imageAlt: 'Mehul Shah, Head of Operations at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'akash-chandrawade',
    name: 'Akash Chandrawade',
    title: 'People, Strategy & Delivery',
    quote:
      'Great things take time and patience, keep moving forward and trust your journey.',
    image: aakashPhoto,
    imageAlt: 'Akash Chandrawade, People, Strategy & Delivery at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
  {
    id: 'ajay-thakur',
    name: 'Ajay Thakur',
    title: 'Head Of Recruitment',
    quote:
      'Your attitude defines your direction, and your actions define your destination.',
    image: ajayPhoto,
    imageAlt: 'Ajay Thakur, Head Of Recruitment at Webkorps',
    linkedinUrl: 'https://www.linkedin.com/company/webkorps',
    emailUrl: 'mailto:contact@webkorps.com',
  },
];

export const Leadership: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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
    if (!trackRef.current) return;
    const { scrollLeft } = trackRef.current;
    const cards = Array.from(trackRef.current.children) as HTMLElement[];
    if (cards.length === 0) return;

    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
      const dist = Math.abs(card.offsetLeft - trackRef.current!.offsetLeft - scrollLeft);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollToSlide = (index: number) => {
    if (!trackRef.current) return;
    const cards = Array.from(trackRef.current.children) as HTMLElement[];
    const targetCard = cards[index];
    if (targetCard) {
      trackRef.current.scrollTo({
        left: targetCard.offsetLeft - trackRef.current.offsetLeft,
        behavior: 'smooth',
      });
      setActiveIndex(index);
    }
  };

  const handleArrow = (direction: 'prev' | 'next') => {
    if (!trackRef.current) return;
    const cards = Array.from(trackRef.current.children) as HTMLElement[];
    if (cards.length === 0) return;

    let targetIndex = direction === 'next' ? activeIndex + 1 : activeIndex - 1;
    if (targetIndex >= cards.length) {
      targetIndex = 0;
    } else if (targetIndex < 0) {
      targetIndex = cards.length - 1;
    }
    scrollToSlide(targetIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleArrow('next');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleArrow('prev');
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`wk-leadership ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="leadership-heading"
      id="leadership"
    >
      <Container size="wide">
        {/* Section Header */}
        <header className="wk-leadership__header">
          <h2 id="leadership-heading" className="wk-leadership__title">
            Meet the leaders
            <span className="wk-leadership__title-break">
              <span className="wk-leadership__title-accent">
                building what's next.
              </span>
            </span>
          </h2>
        </header>

        {/* Carousel Showcase Track: Exactly 2 cards visible on desktop */}
        <div
          ref={trackRef}
          className="wk-leadership__track"
          tabIndex={0}
          role="region"
          aria-label="Leadership team showcase"
          onKeyDown={handleKeyDown}
        >
          {LEADERS_DATA.map((leader, index) => (
            <article
              key={leader.id}
              className={`wk-leader-card ${
                index === activeIndex ? 'wk-leader-card--active' : ''
              }`}
              style={{ transitionDelay: `${index * 120}ms` }}
              aria-label={`${leader.name}, ${leader.title}`}
              onClick={() => scrollToSlide(index)}
            >
              {/* Left Column: Portrait */}
              <div className="wk-leader-card__visual">
                <img
                  src={getImgSrc(leader.image)}
                  alt={leader.imageAlt}
                  className="wk-leader-card__photo"
                  width={340}
                  height={380}
                  loading="lazy"
                />
              </div>

              {/* Right Column: White Content Card */}
              <div className="wk-leader-card__content-panel">
                <div className="wk-leader-card__header-row">
                  <div className="wk-leader-card__header-info">
                    <h3 className="wk-leader-card__name">{leader.name}</h3>
                    <p className="wk-leader-card__title">{leader.title}</p>
                  </div>

                  <div className="wk-leader-card__socials">
                    {/* LinkedIn Badge */}
                    <a
                      href={leader.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wk-leader-card__social-link"
                      aria-label={`${leader.name} on LinkedIn`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                        <rect width="24" height="24" rx="4" fill="#0A66C2" />
                        <path
                          d="M7.12 9.5H4.88V18.5H7.12V9.5ZM6 8.25C6.7 8.25 7.25 7.7 7.25 7C7.25 6.3 6.7 5.75 6 5.75C5.3 5.75 4.75 6.3 4.75 7C4.75 7.7 5.3 8.25 6 8.25ZM19.12 18.5H16.88V13.88C16.88 12.63 16.38 12 15.25 12C14.12 12 13.5 12.75 13.5 13.88V18.5H11.25V9.5H13.5V10.75C14 10 14.88 9.25 16.25 9.25C17.75 9.25 19.12 10.25 19.12 12.63V18.5Z"
                          fill="#FFFFFF"
                        />
                      </svg>
                    </a>

                    {/* Email Badge */}
                    <a
                      href={leader.emailUrl}
                      className="wk-leader-card__social-link"
                      aria-label={`Email ${leader.name}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                        <rect width="24" height="24" rx="4" fill="#1887C9" />
                        <path
                          d="M5 7H19C19.55 7 20 7.45 20 8V16C20 16.55 19.55 17 19 17H5C4.45 17 4 16.55 4 16V8C4 7.45 4.45 7 5 7ZM18 9.25L12 13L6 9.25V15.5H18V9.25ZM12 11.75L17.5 8.25H6.5L12 11.75Z"
                          fill="#FFFFFF"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                <blockquote className="wk-leader-card__quote">
                  <p>{leader.quote}</p>
                </blockquote>
              </div>
            </article>
          ))}
        </div>

        {/* Carousel Navigation Controls */}
        <div className="wk-leadership__controls">
          <button
            type="button"
            className="wk-leadership__arrow-btn wk-leadership__arrow-btn--prev"
            onClick={() => handleArrow('prev')}
            aria-label="Previous leadership card"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>

          <div
            className="wk-leadership__dots"
            role="tablist"
            aria-label="Leadership slide indicators"
          >
            {LEADERS_DATA.map((leader, i) => (
              <button
                key={leader.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to slide ${i + 1}: ${leader.name}`}
                className={`wk-leadership__dot ${
                  i === activeIndex ? 'wk-leadership__dot--active' : ''
                }`}
                onClick={() => scrollToSlide(i)}
              />
            ))}
          </div>

          <button
            type="button"
            className="wk-leadership__arrow-btn wk-leadership__arrow-btn--next"
            onClick={() => handleArrow('next')}
            aria-label="Next leadership card"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      </Container>
    </section>
  );
};
