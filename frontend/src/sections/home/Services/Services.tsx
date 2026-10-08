'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '../../../components/Container/Container';
import serviceMobile from '../../../assets/services/service-mobile.png';
import serviceWeb from '../../../assets/services/service-web.png';
import serviceCustom from '../../../assets/services/service-custom.png';
import serviceBlockchain from '../../../assets/services/service-blockchain.png';
import serviceEnterprise from '../../../assets/services/service-enterprise.png';
import serviceAiml from '../../../assets/services/service-aiml.png';
import { getImgSrc } from '../../../utils/image';
import './Services.css';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  image: string | any;
  imageAlt: string;
  href: string;
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'mobile-app-development',
    title: 'Mobile App Development',
    description: 'Transforming ideas into powerful mobile solutions',
    image: serviceMobile,
    imageAlt: 'Mobile application development on smartphone with code editor',
    href: '#contact',
  },
  {
    id: 'web-development',
    title: 'Web Development',
    description: 'Creating scalable, high-performance web solutions',
    image: serviceWeb,
    imageAlt: 'Web development workspace on laptop showing code environment',
    href: '#contact',
  },
  {
    id: 'custom-software-development',
    title: 'Custom Software Development',
    description: 'Custom software built for your business goals',
    image: serviceCustom,
    imageAlt: 'Custom software development on smartphone with floating code screen',
    href: '#contact',
  },
  {
    id: 'blockchain-development',
    title: 'Blockchain Development',
    description: 'Powering the future of industries with blockchain solutions',
    image: serviceBlockchain,
    imageAlt: 'Isometric 3D blocks representing blockchain and decentralized technology',
    href: '#contact',
  },
  {
    id: 'enterprise-software-development',
    title: 'Enterprise Software Development',
    description: 'Driving business efficiency through enterprise solutions',
    image: serviceEnterprise,
    imageAlt: 'Enterprise software development showing workflow, version control, and system cards',
    href: '#contact',
  },
  {
    id: 'ai-ml-development',
    title: 'AI-ML Development',
    description: 'Unlock business potential through AI-ML solutions',
    image: serviceAiml,
    imageAlt: 'AI and machine learning microchip processor with neural circuitry',
    href: '#contact',
  },
];

export const Services: React.FC = () => {
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
      className={`wk-services ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="services-heading"
    >
      <Container>
        <div className="wk-services__header">
          <h2 id="services-heading" className="wk-services__title">
            Smart Technology for<br />
            Smarter <span className="wk-services__title-accent">Business Growth</span>
          </h2>
        </div>

        <div className="wk-services__grid">
          {SERVICES_DATA.map((service, index) => (
            <article
              key={service.id}
              className="wk-service-card"
              style={{ transitionDelay: `${index * 80}ms` }}
              tabIndex={0}
            >
              <div className="wk-service-card__visual">
                <img
                  src={getImgSrc(service.image)}
                  alt={service.imageAlt}
                  className="wk-service-card__image"
                  loading="lazy"
                  width="460"
                  height="266"
                />
                <div className="wk-service-card__overlay">
                  <p className="wk-service-card__overlay-text">Not sure which fits?</p>
                  <a
                    href={service.href}
                    className="wk-service-card__overlay-btn"
                    aria-label={`Chat with us about ${service.title}`}
                  >
                    <span>Chat with us</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M15.707 0.999999C15.707 0.447715 15.2593 -2.87362e-07 14.707 -5.40243e-07L5.70703 2.60547e-07C5.15475 -7.66277e-08 4.70703 0.447715 4.70703 1C4.70703 1.55228 5.15475 2 5.70703 2L13.707 2L13.707 10C13.707 10.5523 14.1547 11 14.707 11C15.2593 11 15.707 10.5523 15.707 10L15.707 0.999999ZM0.707031 15L1.41414 15.7071L15.4141 1.70711L14.707 1L13.9999 0.292893L-7.55191e-05 14.2929L0.707031 15Z" fill="white" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="wk-service-card__content">
                <h3 className="wk-service-card__heading">{service.title}</h3>
                <p className="wk-service-card__description">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
};
