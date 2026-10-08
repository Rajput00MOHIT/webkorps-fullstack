'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container } from '../../../components/Container/Container';
import { FAQItem } from './FAQItem';
import { FAQCTA } from './FAQCTA';
import { FAQ_DATA } from './faqData';
import './FAQ.css';

export const FAQ: React.FC = () => {
  // First item open by default per Figma design
  const [openId, setOpenId] = useState<string | null>('founded');
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

  const handleToggle = (id: string) => {
    setOpenId((prevId) => (prevId === id ? null : id));
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className={`wk-faq ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="faq-heading"
    >
      <Container size="normal">
        <div className="wk-faq__wrapper">
          {/* Section Heading */}
          <div className="wk-faq__header">
            <h2 id="faq-heading" className="wk-faq__title">
              Frequently Asked <span className="wk-faq__title-accent">Questions</span>
            </h2>
          </div>

          {/* FAQ Accordion List */}
          <div className="wk-faq__list" role="list">
            {FAQ_DATA.map((item, index) => (
              <div
                key={item.id}
                role="listitem"
                className="wk-faq-item-wrapper"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <FAQItem
                  item={item}
                  isOpen={openId === item.id}
                  onToggle={() => handleToggle(item.id)}
                />
              </div>
            ))}
          </div>

          {/* CTA Card */}
          <FAQCTA />
        </div>
      </Container>
    </section>
  );
};
