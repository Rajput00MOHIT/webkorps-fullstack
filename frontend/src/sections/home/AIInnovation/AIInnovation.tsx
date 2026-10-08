'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Container } from '../../../components/Container/Container';
import aiHowWeUse from '../../../assets/ai/ai-how-we-use.png';
import aiHelpsBusiness from '../../../assets/ai/ai-helps-business.png';
import aiDlcMethod from '../../../assets/ai/ai-dlc-method.png';
import aiSaasSmarter from '../../../assets/ai/ai-saas-smarter.png';
import { getImgSrc } from '../../../utils/image';
import './AIInnovation.css';

interface AICardItem {
  id: string;
  title: string;
  description: string;
  image: string | any;
  imageAlt: string;
}

const AI_CARDS_DATA: AICardItem[] = [
  {
    id: 'how-we-use-ai',
    title: 'How We Use AI',
    description:
      'We use AI to automate tasks, analyze data, and build smarter digital experiences tailored to business needs.',
    image: aiHowWeUse,
    imageAlt: 'AI assistant prompt interface for analyzing data and automating tasks',
  },
  {
    id: 'how-ai-helps-business',
    title: 'How AI Helps Your Business',
    description:
      'AI helps reduce manual effort, improve decisions, increase efficiency, and create better customer experiences.',
    image: aiHelpsBusiness,
    imageAlt:
      'AI business outcome flow connecting manual effort reduction, better decisions, efficiency gains, and improved customer experiences',
  },
  {
    id: 'ai-dlc-method',
    title: 'Our AI DLC Method',
    description:
      'Discover opportunities, leverage the right AI, and create smarter solutions that deliver real business value.',
    image: aiDlcMethod,
    imageAlt: 'AI DLC lifecycle diagram depicting Inception, Construction, and Operations stages',
  },
  {
    id: 'make-saas-smarter',
    title: 'Make Your SaaS Smarter With AI',
    description:
      'We identify the right AI opportunities for your SaaS from AI assistants and smart search to automation, recommendations.',
    image: aiSaasSmarter,
    imageAlt: 'SaaS software application window highlighting AI search and assistant capabilities',
  },
];

export const AIInnovation: React.FC = () => {
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
      className={`wk-ai-innovation ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="ai-heading"
    >
      <Container>
        <div className="wk-ai-innovation__header">
          <h2 id="ai-heading" className="wk-ai-innovation__title">
            AI-Powered Innovation<br />
            <span className="wk-ai-innovation__title-accent">for Your Business</span>
          </h2>
        </div>

        <div className="wk-ai-innovation__grid">
          {AI_CARDS_DATA.map((card, index) => (
            <article
              key={card.id}
              className="wk-ai-card"
              style={{ transitionDelay: `${index * 100}ms` }}
              tabIndex={0}
            >
              <div className="wk-ai-card__visual">
                <img
                  src={getImgSrc(card.image)}
                  alt={card.imageAlt}
                  className="wk-ai-card__image"
                  loading="lazy"
                  width="661"
                  height="391"
                />
              </div>
              <div className="wk-ai-card__content">
                <h3 className="wk-ai-card__heading">{card.title}</h3>
                <p className="wk-ai-card__description">{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};
