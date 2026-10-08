import React from 'react';
import { Container } from '../../../components/Container/Container';
import { OEM_PARTNERS_DATA } from './oemPartnersData';
import logoWebkorps from '../../../assets/oem/logo_webkorps.png';
import { getImgSrc } from '../../../utils/image';
import './TrustedOEMPartners.css';

export const TrustedOEMPartners: React.FC = () => {
  return (
    <section
      id="oem-partners"
      className="wk-oem"
      aria-labelledby="oem-partners-heading"
    >
      <Container size="wide">
        {/* Section Heading */}
        <div className="wk-oem__header">
          <h2 id="oem-partners-heading" className="wk-oem__title">
            Trusted <span className="wk-oem__title-accent">OEM Partners.</span> Proven
            <br />
            Technology
          </h2>
        </div>

        {/* Continuous Orbital Ecosystem Stage */}
        <div
          className="wk-oem__stage"
          aria-label="Interactive OEM partners continuous orbital ecosystem"
        >
          {/* Background Concentric Arc Surfaces */}
          <svg
            className="wk-oem__bg-arcs"
            viewBox="0 0 1920 900"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
          >
            {/* Outermost pale blue arc band */}
            <circle cx="960" cy="900" r="910" fill="#F2F8FE" />
            {/* Middle soft blue arc band */}
            <circle cx="960" cy="900" r="755" fill="#E8F2FB" />
            {/* Innermost sky blue arc band */}
            <circle cx="960" cy="900" r="595" fill="#E1EEFB" />
            {/* Center dome surface */}
            <circle cx="960" cy="900" r="350" fill="#FFFFFF" />

            {/* Exact orbital trajectory centerline tracks */}
            <circle
              cx="960"
              cy="900"
              r="855"
              fill="none"
              stroke="#D8E8F5"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              opacity="0.85"
            />
            <circle
              cx="960"
              cy="900"
              r="702"
              fill="none"
              stroke="#D8E8F5"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              opacity="0.85"
            />
            <circle
              cx="960"
              cy="900"
              r="549"
              fill="none"
              stroke="#D8E8F5"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              opacity="0.85"
            />
          </svg>

          {/* Central Webkorps Anchor (Stationary, Non-Rotating Anchor) */}
          <div
            className="wk-oem__center-anchor"
            aria-label="Webkorps - Centered Technology Ecosystem Anchor"
          >
            <img
              src={getImgSrc(logoWebkorps)}
              alt="Webkorps"
              className="wk-oem__center-logo"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Independent Orbital Tracks for Each Partner Logo */}
          <div className="wk-oem__orbit-system" aria-label="Partner logos circulating around Webkorps">
            {OEM_PARTNERS_DATA.map((partner) => (
              <div
                key={partner.id}
                className={`wk-oem__track wk-oem__track--${partner.id} wk-oem__track--${partner.orbit}`}
                style={
                  {
                    '--orbit-r': partner.orbitRadiusCss,
                    '--duration': `${partner.speedSeconds}s`,
                    '--delay': `${partner.delaySeconds}s`,
                    '--base-size': `${partner.badgeSize}px`,
                    '--logo-w': `${partner.logoMaxWidth}px`,
                    '--static-angle': `${partner.initialAngleDeg}deg`,
                  } as React.CSSProperties
                }
              >
                <div className="wk-oem__arm">
                  <div
                    className={`wk-oem__badge wk-oem__badge--${partner.id} wk-oem__badge--${partner.id.replace(/-\d+$/, '')}`}
                    role="img"
                    aria-label={`${partner.name} partner logo`}
                    tabIndex={0}
                  >
                    <img
                      src={getImgSrc(partner.logo)}
                      alt={partner.name}
                      className="wk-oem__logo"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
