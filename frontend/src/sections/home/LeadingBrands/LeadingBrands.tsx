'use client';

import React, { useEffect, useRef, useState } from 'react';
import verizonLogo from '../../../assets/brands/verizon.png';
import acimaLogo from '../../../assets/brands/acima.png';
import bhaiBandhuLogo from '../../../assets/brands/bhai-bandhu.png';
import cryoportLogo from '../../../assets/brands/cryoport.png';
import puravankaraLogo from '../../../assets/brands/puravankara.png';
import propertyFinderLogo from '../../../assets/brands/property-finder.png';
import cloudshotLogo from '../../../assets/brands/cloudshot.png';
import inKindLogo from '../../../assets/brands/InKind.png';
import shreeLaxmiLogo from '../../../assets/brands/Shreelaxmi.png';
import { getImgSrc } from '../../../utils/image';
import './LeadingBrands.css';

interface Brand {
  name: string;
  logo: string | any;
  width: number;
  height: number;
}

const BRANDS: Brand[] = [
  { name: 'Verizon', logo: verizonLogo, width: 120, height: 32 },
  { name: 'Acima', logo: acimaLogo, width: 120, height: 32 },
  { name: 'Bhai Bandhu', logo: bhaiBandhuLogo, width: 110, height: 38 },
  { name: 'Cryoport Systems', logo: cryoportLogo, width: 140, height: 44 },
  { name: 'Puravankara', logo: puravankaraLogo, width: 145, height: 30 },
  { name: 'Property Finder', logo: propertyFinderLogo, width: 110, height: 40 },
  { name: 'Cloudshot', logo: cloudshotLogo, width: 110, height: 36 },
  { name: 'InKind', logo: inKindLogo, width: 125, height: 36 },
  { name: 'Shreelaxmi', logo: shreeLaxmiLogo, width: 125, height: 36 },
];

export const LeadingBrands: React.FC = () => {
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
      className={`wk-brands ${isVisible ? 'is-visible' : ''}`}
      aria-labelledby="brands-heading"
    >
      <div className="site-container">
        {/* Section Heading */}
        <div className="wk-brands__header">
          <h2 id="brands-heading" className="wk-brands__title">
            Leading Brands <span className="wk-brands__highlight">That Trust</span>
            <br />
            <span className="wk-brands__highlight">Our IT Solutions</span> &amp; Services
          </h2>
        </div>

        {/* Continuous Marquee Container */}
        <div className="wk-brands__marquee-wrapper" aria-label="Trusted client brands">
          <div className="wk-brands__marquee-track" role="list">
            {/* Primary set */}
            {BRANDS.map((brand) => (
              <div key={brand.name} className="wk-brands__logo-item" role="listitem">
                <img
                  src={getImgSrc(brand.logo)}
                  alt={`${brand.name} logo`}
                  className="wk-brands__logo-image"
                  width={brand.width}
                  height={brand.height}
                  loading="lazy"
                />
              </div>
            ))}
            {/* Duplicated set for seamless infinite scroll */}
            {BRANDS.map((brand, idx) => (
              <div
                key={`${brand.name}-duplicate-${idx}`}
                className="wk-brands__logo-item"
                aria-hidden="true"
              >
                <img
                  src={getImgSrc(brand.logo)}
                  alt=""
                  className="wk-brands__logo-image"
                  width={brand.width}
                  height={brand.height}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section Bottom Divider */}
        <hr className="wk-brands__divider" aria-hidden="true" />
      </div>
    </section>
  );
};
