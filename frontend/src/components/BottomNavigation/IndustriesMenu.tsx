'use client';

import React from 'react';
import { INDUSTRIES_NAV_DATA } from './navigationData';
import industrySpotlightImg from '../../assets/industries/industry-spotlight.png';
import { getImgSrc } from '../../utils/image';

interface IndustriesMenuProps {
  onItemClick?: () => void;
}

const INDUSTRY_ICONS: Record<string, React.ReactNode> = {
  logistic: (
    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="16" viewBox="0 0 19 16" fill="none">
      <path d="M11.0008 12.6655V2.6665C11.0008 2.22452 10.8252 1.80064 10.5126 1.48811C10.2 1.17558 9.77606 1 9.334 1H2.6668C2.22474 1 1.80078 1.17558 1.48819 1.48811C1.17561 1.80064 1 2.22452 1 2.6665V11.8322C1 12.0532 1.0878 12.2652 1.2441 12.4214C1.40039 12.5777 1.61237 12.6655 1.8334 12.6655H3.5002M3.5002 12.6655C3.5002 13.5859 4.24645 14.332 5.167 14.332C6.08755 14.332 6.8338 13.5859 6.8338 12.6655M3.5002 12.6655C3.5002 11.7451 4.24645 10.999 5.167 10.999C6.08755 10.999 6.8338 11.7451 6.8338 12.6655M6.8338 12.6655H11.8342M11.8342 12.6655C11.8342 13.5859 12.5805 14.332 13.501 14.332C14.4215 14.332 15.1678 13.5859 15.1678 12.6655M11.8342 12.6655C11.8342 11.7451 12.5805 10.999 13.501 10.999C14.4215 10.999 15.1678 11.7451 15.1678 12.6655M15.1678 12.6655H16.8346C17.0556 12.6655 17.2676 12.5777 17.4239 12.4214C17.5802 12.2652 17.668 12.0532 17.668 11.8322V8.79089C17.6677 8.60179 17.603 8.41843 17.4847 8.27094L14.5844 4.6463C14.5065 4.54871 14.4076 4.46989 14.2951 4.41566C14.1825 4.36143 14.0593 4.33318 13.9344 4.333H11.0008" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'real-estate': (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 17.4993V10.8327C12.5 10.6117 12.4122 10.3997 12.2559 10.2434C12.0996 10.0871 11.8877 9.99935 11.6667 9.99935H8.33333C8.11232 9.99935 7.90036 10.0871 7.74408 10.2434C7.5878 10.3997 7.5 10.6117 7.5 10.8327V17.4993M2.5 8.33308C2.49994 8.09064 2.55278 7.8511 2.65482 7.63118C2.75687 7.41126 2.90566 7.21625 3.09083 7.05975L8.92417 2.05975C9.22499 1.80551 9.60613 1.66602 10 1.66602C10.3939 1.66602 10.775 1.80551 11.0758 2.05975L16.9092 7.05975C17.0943 7.21625 17.2431 7.41126 17.3452 7.63118C17.4472 7.8511 17.5001 8.09064 17.5 8.33308V15.8331C17.5 16.2751 17.3244 16.699 17.0118 17.0116C16.6993 17.3242 16.2754 17.4997 15.8333 17.4997H4.16667C3.72464 17.4997 3.30072 17.3242 2.98816 17.0116C2.67559 16.699 2.5 16.2751 2.5 15.8331V8.33308Z" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  healthcare: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M18.334 10H16.2672C15.903 9.99924 15.5485 10.1178 15.258 10.3375C14.9676 10.5573 14.7571 10.8661 14.6587 11.2168L12.7002 18.184C12.6876 18.2273 12.6613 18.2653 12.6252 18.2923C12.5892 18.3194 12.5453 18.334 12.5002 18.334C12.4551 18.334 12.4113 18.3194 12.3752 18.2923C12.3391 18.2653 12.3128 18.2273 12.3002 18.184L7.69983 1.81603C7.68721 1.77275 7.66089 1.73473 7.62482 1.70769C7.58876 1.68064 7.5449 1.66602 7.49982 1.66602C7.45473 1.66602 7.41087 1.68064 7.37481 1.70769C7.33874 1.73473 7.31242 1.77275 7.2998 1.81603L5.34131 8.78325C5.24336 9.13257 5.0341 9.4404 4.74531 9.66C4.45653 9.8796 4.10398 9.99898 3.74118 10H1.66602" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  retail: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M13.3333 8.33322C13.3333 9.21734 12.9821 10.0653 12.357 10.6904C11.7319 11.3156 10.8841 11.6668 10 11.6668C9.11594 11.6668 8.2681 11.3156 7.64298 10.6904C7.01786 10.0653 6.66667 9.21734 6.66667 8.33322M2.58545 5.0281H17.4138M2.83333 4.55541C2.61696 4.84393 2.5 5.19485 2.5 5.55549V16.6672C2.5 17.1093 2.67559 17.5332 2.98816 17.8458C3.30072 18.1584 3.72464 18.334 4.16667 18.334H15.8333C16.2754 18.334 16.6993 18.1584 17.0118 17.8458C17.3244 17.5332 17.5 17.1093 17.5 16.6672V5.55549C17.5 5.19485 17.383 4.84393 17.1667 4.55541L15.5 2.33274C15.3448 2.12573 15.1434 1.95771 14.912 1.84198C14.6806 1.72626 14.4254 1.66602 14.1667 1.66602H5.83333C5.57459 1.66602 5.3194 1.72626 5.08798 1.84198C4.85655 1.95771 4.65525 2.12573 4.5 2.33274L2.83333 4.55541Z" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fintech: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M1.66602 8.33316H18.334M3.33282 4.16602H16.6672C17.5878 4.16602 18.334 4.91229 18.334 5.83287V14.1672C18.334 15.0877 17.5878 15.834 16.6672 15.834H3.33282C2.41227 15.834 1.66602 15.0877 1.66602 14.1672V5.83287C1.66602 4.91229 2.41227 4.16602 3.33282 4.16602Z" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  travel: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M7.5 2.69598C7.24139 2.69598 6.98634 2.75616 6.755 2.87176L2.96084 4.76926C2.82244 4.83842 2.70602 4.94474 2.62463 5.07632C2.54324 5.2079 2.50009 5.35954 2.5 5.51426V16.1501C2.49965 16.2923 2.5357 16.4322 2.60471 16.5566C2.67372 16.6809 2.7734 16.7855 2.89427 16.8604C3.01513 16.9354 3.15316 16.9781 3.29522 16.9846C3.43727 16.9911 3.57863 16.9612 3.70584 16.8976L6.755 15.3726C6.98634 15.257 7.24139 15.1968 7.5 15.1968C7.75861 15.1968 8.01367 15.257 8.245 15.3726L11.755 17.1276C11.9863 17.2432 12.2414 17.3034 12.5 17.3034C12.7586 17.3034 13.0137 17.2432 13.245 17.1276L17.0392 15.2301C17.1776 15.1609 17.294 15.0546 17.3754 14.923C17.4568 14.7915 17.4999 14.6398 17.5 14.4851V3.84843C17.5002 3.70629 17.4641 3.56647 17.395 3.44225C17.3259 3.31802 17.2262 3.21353 17.1054 3.1387C16.9845 3.06388 16.8466 3.0212 16.7046 3.01473C16.5626 3.00827 16.4213 3.03823 16.2942 3.10176L13.245 4.62676C13.0137 4.74236 12.7586 4.80254 12.5 4.80254C12.2414 4.80254 11.9863 4.74236 11.755 4.62676L8.245 2.87176C8.01367 2.75616 7.75861 2.69598 7.5 2.69598ZM12.5 4.80254L12.5 17.3021M7.5 2.69598L7.5 15.196" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warehouse: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18.334V10.0002M10 10.0002L2.7417 5.83325M10 10.0002L17.2584 5.83325M6.25 3.55773L13.75 7.84964M9.16667 18.1089C9.42003 18.2552 9.70744 18.3322 10 18.3322C10.2926 18.3322 10.58 18.2552 10.8333 18.1089L16.6667 14.7753C16.9198 14.6292 17.13 14.4191 17.2763 14.166C17.4225 13.913 17.4997 13.6259 17.5 13.3336V6.66655C17.4997 6.37426 17.4225 6.08719 17.2763 5.83414C17.13 5.58108 16.9198 5.37094 16.6667 5.2248L10.8333 1.89127C10.58 1.74498 10.2926 1.66797 10 1.66797C9.70744 1.66797 9.42003 1.74498 9.16667 1.89127L3.33333 5.2248C3.08022 5.37094 2.86998 5.58108 2.72372 5.83414C2.57745 6.08719 2.5003 6.37426 2.5 6.66655V13.3336C2.5003 13.6259 2.57745 13.913 2.72372 14.166C2.86998 14.4191 3.08022 14.6292 3.33333 14.7753L9.16667 18.1089Z" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export const IndustriesMenu: React.FC<IndustriesMenuProps> = ({ onItemClick }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (onItemClick) {
      onItemClick();
    }
    if (href.startsWith('#')) {
      const targetId = href.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="wk-mega-menu__industries-layout">
      {/* Left: Compact 2-Column Industry Grid */}
      <div className="wk-mega-menu__industries-grid">
        {INDUSTRIES_NAV_DATA.map((industry, idx) => (
          <a
            key={industry.id}
            href={industry.href}
            className="wk-mega-menu__industry-card"
            onClick={(e) => handleLinkClick(e, industry.href)}
            style={{ '--item-stagger': `${idx * 30}ms` } as React.CSSProperties}
          >
            <div className="wk-mega-menu__industry-icon-box" aria-hidden="true">
              {INDUSTRY_ICONS[industry.id] || (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <div className="wk-mega-menu__industry-info">
              <span className="wk-mega-menu__industry-title">{industry.title}</span>
              <p className="wk-mega-menu__industry-desc">{industry.description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Right: Aligned Industry Spotlight Card */}
      <aside className="wk-mega-menu__industry-spotlight" aria-label="Industry Spotlight">
        <img
          src={getImgSrc(industrySpotlightImg)}
          alt="Smart Tech in Modern Industries"
          className="wk-mega-menu__industry-spotlight-img"
          width={340}
          height={165}
          loading="eager"
        />
        <div className="wk-mega-menu__industry-spotlight-content">
          <span className="wk-mega-menu__industry-spotlight-badge">INDUSTRY SPOTLIGHT</span>
          <h4 className="wk-mega-menu__industry-spotlight-title">
            How Smart Tech is Transforming Modern Industries
          </h4>
          <p className="wk-mega-menu__industry-spotlight-desc">
            Discover how AI, automation, and cloud-first engineering are reshaping operations across logistics, healthcare, fintech, and retail.
          </p>
          <a
            href="#insights"
            className="wk-mega-menu__industry-spotlight-link"
            onClick={(e) => handleLinkClick(e, '#insights')}
          >
            <span>Read More</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </aside>
    </div>
  );
};
