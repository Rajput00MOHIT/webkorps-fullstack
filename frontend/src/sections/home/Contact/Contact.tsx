'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Container } from '../../../components/Container/Container';
import { ContactVisual } from './ContactVisual';
import { ContactForm } from './ContactForm';
import './Contact.css';

export const Contact: React.FC = () => {
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
      id="contact"
      className={`wk-contact ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="contact-heading"
    >
      <Container size="normal">
        <div className="wk-contact__grid">
          {/* Left Column: Heading and 3D Visual Asset */}
          <div className="wk-contact__info">
            <h2 id="contact-heading" className="wk-contact__title">
              Talk to Our <br className="wk-contact__title-break" />
              <span className="wk-contact__title-accent">Support Team</span>
            </h2>
            <ContactVisual />
          </div>

          {/* Right Column: Interactive Contact Form Card */}
          <div className="wk-contact__form-col">
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
};
