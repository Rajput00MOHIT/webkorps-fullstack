'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Container } from '../../../components/Container/Container';
import integrationIot from '../../../assets/integrations/integration-iot.png';
import integrationRpa from '../../../assets/integrations/integration-rpa.png';
import integrationAiml from '../../../assets/integrations/integration-aiml.png';
import integrationCybersecurity from '../../../assets/integrations/integration-cybersecurity.png';
import integrationDataanalytics from '../../../assets/integrations/integration-dataanalytics.png';
import integrationBlockchain from '../../../assets/integrations/integration-blockchain.png';
import { getImgSrc } from '../../../utils/image';
import './Integrations.css';

interface TechnologyItem {
  id: string;
  name: string;
  image: string | any;
  imageAlt: string;
}

const TECHNOLOGIES_DATA: TechnologyItem[] = [
  {
    id: 'iot',
    name: 'Internet of Things',
    image: integrationIot,
    imageAlt: 'Internet of Things illuminated smart keyboard key showing IoT technology',
  },
  {
    id: 'rpa',
    name: 'Robotics Process Automation',
    image: integrationRpa,
    imageAlt: 'Robotic Process Automation illuminated digital tablet with microprocessor circuitry',
  },
  {
    id: 'aiml',
    name: 'AI & ML',
    image: integrationAiml,
    imageAlt: 'Human hand and robotic cyborg finger connecting around glowing AI brain hologram',
  },
  {
    id: 'cybersecurity',
    name: 'Cyber Security',
    image: integrationCybersecurity,
    imageAlt: 'Cyber Security glowing neon shield emblem with verified checkmark',
  },
  {
    id: 'dataanalytics',
    name: 'Data Analytics',
    image: integrationDataanalytics,
    imageAlt: 'Data Analytics glowing trend growth curve and ascending metrics',
  },
  {
    id: 'blockchain',
    name: 'Block Chain',
    image: integrationBlockchain,
    imageAlt: 'Block Chain glowing 3D isometric blocks with secure encrypted data links',
  },
];

function renderTechnologyIcon(id: string) {
  switch (id) {
    case 'iot':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wk-integrations__icon-svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.2" />
          <circle cx="12" cy="4" r="2" />
          <circle cx="5" cy="17.5" r="2" />
          <circle cx="19" cy="17.5" r="2" />
          <line x1="12" y1="6" x2="12" y2="8.8" />
          <line x1="6.8" y1="16" x2="9.5" y2="14" />
          <line x1="17.2" y1="16" x2="14.5" y2="14" />
          <path d="M6.5 7.5A8.5 8.5 0 0 1 17.5 7.5" strokeDasharray="2 2" />
          <path d="M20 12A8.5 8.5 0 0 1 18 19" strokeDasharray="2 2" />
          <path d="M6 19A8.5 8.5 0 0 1 4 12" strokeDasharray="2 2" />
        </svg>
      );
    case 'rpa':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wk-integrations__icon-svg"
          aria-hidden="true"
        >
          <path d="M12 2.5L20.5 7.4V16.6L12 21.5L3.5 16.6V7.4L12 2.5Z" />
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
          <path d="M12 4.5V8.5M12 15.5V19.5M5.5 8.5L8.8 10.5M15.2 13.5L18.5 15.5M5.5 15.5L8.8 13.5M15.2 10.5L18.5 8.5" />
        </svg>
      );
    case 'aiml':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wk-integrations__icon-svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
          <circle cx="12" cy="20" r="1.5" fill="currentColor" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" />
          <circle cx="20" cy="12" r="1.5" fill="currentColor" />
          <circle cx="6.3" cy="6.3" r="1.5" fill="currentColor" />
          <circle cx="17.7" cy="6.3" r="1.5" fill="currentColor" />
          <circle cx="6.3" cy="17.7" r="1.5" fill="currentColor" />
          <circle cx="17.7" cy="17.7" r="1.5" fill="currentColor" />
          <line x1="12" y1="9.5" x2="12" y2="5.5" />
          <line x1="12" y1="14.5" x2="12" y2="18.5" />
          <line x1="9.5" y1="12" x2="5.5" y2="12" />
          <line x1="14.5" y1="12" x2="18.5" y2="12" />
          <line x1="10.2" y1="10.2" x2="7.4" y2="7.4" />
          <line x1="13.8" y1="10.2" x2="16.6" y2="7.4" />
          <line x1="10.2" y1="13.8" x2="7.4" y2="16.6" />
          <line x1="13.8" y1="13.8" x2="16.6" y2="16.6" />
        </svg>
      );
    case 'cybersecurity':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wk-integrations__icon-svg"
          aria-hidden="true"
        >
          <path d="M12 2.5C12 2.5 19.5 4 19.5 10.5C19.5 16.5 12 21.5 12 21.5C12 21.5 4.5 16.5 4.5 10.5C4.5 4 12 2.5 12 2.5Z" />
          <path d="M9 11.8L11.2 14L15.5 9.5" strokeWidth="2" />
        </svg>
      );
    case 'dataanalytics':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wk-integrations__icon-svg"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="6.5" />
          <line x1="15" y1="15" x2="20.5" y2="20.5" strokeWidth="2.2" />
          <line x1="7.5" y1="12.5" x2="7.5" y2="10.5" strokeWidth="1.8" />
          <line x1="10" y1="12.5" x2="10" y2="8.5" strokeWidth="1.8" />
          <line x1="12.5" y1="12.5" x2="12.5" y2="7" strokeWidth="1.8" />
        </svg>
      );
    case 'blockchain':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="wk-integrations__icon-svg"
          aria-hidden="true"
        >
          <path d="M11 2.5L18 6.5V13.5L11 17.5L4 13.5V6.5L11 2.5Z" />
          <path d="M11 2.5V17.5" />
          <path d="M11 10L18 6.5" />
          <path d="M11 10L4 6.5" />
          <path d="M14.5 18.5H17A2 2 0 0 1 19 20.5A2 2 0 0 1 17 22.5H14.5" />
          <path d="M16 16.5H13.5A2 2 0 0 0 11.5 18.5A2 2 0 0 0 13.5 20.5H16" />
        </svg>
      );
    default:
      return null;
  }
}

export const Integrations: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(TECHNOLOGIES_DATA[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

  const activeItem =
    TECHNOLOGIES_DATA.find((item) => item.id === activeId) ||
    TECHNOLOGIES_DATA[0];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let targetIndex = currentIndex;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        targetIndex = (currentIndex + 1) % TECHNOLOGIES_DATA.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        targetIndex =
          (currentIndex - 1 + TECHNOLOGIES_DATA.length) %
          TECHNOLOGIES_DATA.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIndex = TECHNOLOGIES_DATA.length - 1;
      } else {
        return;
      }

      const nextItem = TECHNOLOGIES_DATA[targetIndex];
      setActiveId(nextItem.id);
      tabRefs.current[targetIndex]?.focus();
    },
    []
  );

  return (
    <section
      ref={sectionRef}
      className={`wk-integrations ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="integrations-heading"
      id="integrations"
    >
      <Container size="wide">
        {/* Section Header */}
        <header className="wk-integrations__header">
          <h2 id="integrations-heading" className="wk-integrations__title">
            Our Seamless Integrations to
            <span className="wk-integrations__title-break">
              Enhance{' '}
              <span className="wk-integrations__title-accent">
                Your Digital Ecosystem
              </span>
            </span>
          </h2>
        </header>

        {/* Semantic Headings for Search/AI Discoverability */}
        <div className="sr-only">
          {TECHNOLOGIES_DATA.map((item) => (
            <h3 key={item.id}>{item.name}</h3>
          ))}
        </div>

        {/* Interactive Layout: Left Tabs + Right Visual Showcase */}
        <div className="wk-integrations__layout">
          {/* Tabs Column */}
          <div
            className="wk-integrations__tabs-list"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Seamless technology capabilities and digital integrations"
          >
            {TECHNOLOGIES_DATA.map((item, index) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className={`wk-integrations__tab ${
                    isActive ? 'wk-integrations__tab--active' : ''
                  }`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                  onClick={() => setActiveId(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  type="button"
                >
                  <span
                    className="wk-integrations__tab-icon"
                    aria-hidden="true"
                  >
                    {renderTechnologyIcon(item.id)}
                  </span>
                  <span className="wk-integrations__tab-name">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Image Showcase Panel */}
          <div
            id={`panel-${activeItem.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeItem.id}`}
            className="wk-integrations__display"
          >
            <div className="wk-integrations__image-wrapper">
              <img
                key={activeItem.id}
                src={getImgSrc(activeItem.image)}
                alt={activeItem.imageAlt}
                className="wk-integrations__image"
                width={760}
                height={480}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
