'use client';

import React, { useState } from 'react';
import { SERVICES_DATA, IMPACT_DATA } from './navigationData';
import wekorpsIcon from '../../assets/wekorps iconsvg.svg';
import { getImgSrc } from '../../utils/image';

interface ServicesMenuProps {
  onItemClick?: () => void;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'web-dev': (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 15 14" fill="none">
      <path d="M4.75032 12.75H10.0841M7.4172 10.0833V12.75M2.08344 0.75H12.751C13.4874 0.75 14.0844 1.34695 14.0844 2.08333V8.75C14.0844 9.48638 13.4874 10.0833 12.751 10.0833H2.08344C1.347 10.0833 0.75 9.48638 0.75 8.75V2.08333C0.75 1.34695 1.347 0.75 2.08344 0.75Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'custom-software': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8.1123 0.905273C8.22356 0.916165 8.33283 0.943488 8.43652 0.986328C8.57505 1.0436 8.7016 1.12742 8.80762 1.2334L14.7666 7.19238C14.9892 7.41495 15.0996 7.70765 15.0996 8C15.0996 8.29238 14.9887 8.58457 14.7656 8.80762L8.80762 14.7666C8.58503 14.9892 8.29182 15.0996 8 15.0996C7.70814 15.0996 7.41544 14.9887 7.19238 14.7656L1.2334 8.80762C1.01083 8.58505 0.900391 8.29235 0.900391 8C0.900391 7.70765 1.01083 7.41495 1.2334 7.19238L7.19238 1.2334C7.41497 1.01081 7.70818 0.900391 8 0.900391L8.1123 0.905273ZM2.12305 8L8 13.877L13.877 8L8 2.12305L2.12305 8Z" fill="#1A87C8" stroke="#1A87C8" strokeWidth="0.2" />
    </svg>
  ),
  'ecommerce': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.36719 1.36639H2.70052L4.47385 9.64681C4.53891 9.95007 4.70763 10.2212 4.951 10.4134C5.19436 10.6057 5.49712 10.7071 5.80719 10.7002H12.3272C12.6306 10.6997 12.9248 10.5957 13.1612 10.4054C13.3976 10.2151 13.5619 9.94985 13.6272 9.65348L14.7272 4.6999H3.41385M6.00065 14.0005C6.00065 14.3687 5.70217 14.6672 5.33398 14.6672C4.96579 14.6672 4.66732 14.3687 4.66732 14.0005C4.66732 13.6323 4.96579 13.3338 5.33398 13.3338C5.70217 13.3338 6.00065 13.6323 6.00065 14.0005ZM13.334 14.0005C13.334 14.3687 13.0355 14.6672 12.6673 14.6672C12.2991 14.6672 12.0007 14.3687 12.0007 14.0005C12.0007 13.6323 12.2991 13.3338 12.6673 13.3338C13.0355 13.3338 13.334 13.6323 13.334 14.0005Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'enterprise-software': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10.6661 13.3328V2.66616C10.6661 2.31254 10.5256 1.9734 10.2756 1.72335C10.0255 1.4733 9.68632 1.33282 9.33267 1.33282H6.66579C6.31214 1.33282 5.97298 1.4733 5.72291 1.72335C5.47284 1.9734 5.33235 2.31254 5.33235 2.66616V13.3328M2.66547 3.99949H13.333C14.0694 3.99949 14.6664 4.59645 14.6664 5.33282V11.9995C14.6664 12.7359 14.0694 13.3328 13.333 13.3328H2.66547C1.92903 13.3328 1.33203 12.7359 1.33203 11.9995V5.33282C1.33203 4.59645 1.92903 3.99949 2.66547 3.99949Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'cloud-app': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5.99969 12.6672H11.6666C12.4623 12.6672 13.2254 12.3511 13.7881 11.7884C14.3507 11.2258 14.6668 10.4626 14.6668 9.66688C14.6668 8.87114 14.3507 8.10799 13.7881 7.54532C13.2254 6.98265 12.4623 6.66654 11.6666 6.66654H10.4732C10.226 5.8371 9.75293 5.09276 9.107 4.5167C8.46106 3.94064 7.66768 3.55555 6.8155 3.40448C5.96331 3.2534 5.08591 3.34228 4.28134 3.66119C3.47676 3.98009 2.7767 4.51646 2.2594 5.21036C1.7421 5.90426 1.42792 6.72834 1.35198 7.59053C1.27605 8.45271 1.44134 9.31903 1.82939 10.0927C2.21745 10.8663 2.81297 11.5168 3.54942 11.9715C4.28586 12.4261 5.13422 12.667 5.99969 12.6672Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'staff-aug': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10.6661 14V12.6667C10.6661 11.9594 10.3851 11.2811 9.885 10.781C9.38486 10.281 8.70653 10 7.99923 10H3.99891C3.29161 10 2.61328 10.281 2.11314 10.781C1.61301 11.2811 1.33203 11.9594 1.33203 12.6667V14M10.6661 2.08529C11.238 2.23353 11.7445 2.56746 12.106 3.03466C12.4676 3.50186 12.6637 4.07588 12.6637 4.66662C12.6637 5.25736 12.4676 5.83138 12.106 6.29858C11.7445 6.76578 11.238 7.09971 10.6661 7.24795M14.6664 13.9999V12.6666C14.666 12.0757 14.4693 11.5018 14.1073 11.0348C13.7453 10.5678 13.2384 10.2343 12.6663 10.0866M8.66595 4.66667C8.66595 6.13943 7.47195 7.33333 5.99907 7.33333C4.52619 7.33333 3.33219 6.13943 3.33219 4.66667C3.33219 3.19391 4.52619 2 5.99907 2C7.47195 2 8.66595 3.19391 8.66595 4.66667Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'managed-it': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.44775 2.7579C6.48449 2.37147 6.66399 2.01263 6.95118 1.75146C7.23837 1.4903 7.61263 1.34558 8.00083 1.34558C8.38903 1.34558 8.76329 1.4903 9.05048 1.75146C9.33767 2.01263 9.51717 2.37147 9.55391 2.7579C9.57599 3.00752 9.65789 3.24815 9.79267 3.45942C9.92746 3.67069 10.1112 3.84638 10.3283 3.97162C10.5453 4.09686 10.7894 4.16796 11.0398 4.17891C11.2902 4.18985 11.5395 4.14032 11.7667 4.0345C12.1194 3.87436 12.5192 3.85119 12.8881 3.9695C13.257 4.0878 13.5687 4.33912 13.7625 4.67454C13.9563 5.00996 14.0183 5.40549 13.9365 5.78413C13.8548 6.16278 13.635 6.49746 13.3201 6.72304C13.115 6.86693 12.9476 7.0581 12.832 7.28037C12.7164 7.50263 12.6561 7.74946 12.6561 7.99998C12.6561 8.2505 12.7164 8.49733 12.832 8.7196C12.9476 8.94186 13.115 9.13303 13.3201 9.27692C13.635 9.5025 13.8548 9.83718 13.9365 10.2158C14.0183 10.5945 13.9563 10.99 13.7625 11.3254C13.5687 11.6608 13.257 11.9122 12.8881 12.0305C12.5192 12.1488 12.1194 12.1256 11.7667 11.9655C11.5395 11.8596 11.2902 11.8101 11.0398 11.8211C10.7894 11.832 10.5453 11.9031 10.3283 12.0283C10.1112 12.1536 9.92746 12.3293 9.79267 12.5405C9.65789 12.7518 9.57599 12.9924 9.55391 13.2421C9.51717 13.6285 9.33767 13.9873 9.05048 14.2485C8.76329 14.5097 8.38903 14.6544 8.00083 14.6544C7.61263 14.6544 7.23837 14.5097 6.95118 14.2485C6.66399 13.9873 6.48449 13.6285 6.44775 13.2421C6.42571 12.9924 6.34381 12.7516 6.20899 12.5403C6.07416 12.3289 5.89037 12.1532 5.6732 12.0279C5.45603 11.9027 5.21187 11.8316 4.9614 11.8207C4.71093 11.8099 4.46152 11.8595 4.23431 11.9655C3.88155 12.1256 3.48183 12.1488 3.11292 12.0305C2.74402 11.9122 2.43234 11.6608 2.23854 11.3254C2.04473 10.99 1.98268 10.5945 2.06444 10.2158C2.14621 9.83718 2.36595 9.5025 2.6809 9.27692C2.88599 9.13303 3.05341 8.94186 3.16898 8.7196C3.28456 8.49733 3.3449 8.2505 3.3449 7.99998C3.3449 7.74946 3.28456 7.50263 3.16898 7.28037C3.05341 7.0581 2.88599 6.86693 2.6809 6.72304C2.3664 6.49735 2.14704 6.1628 2.06547 5.78441C1.9839 5.40602 2.04594 5.01082 2.23954 4.67561C2.43313 4.34041 2.74445 4.08915 3.11298 3.97067C3.48152 3.85218 3.88095 3.87493 4.23364 4.0345C4.46083 4.14032 4.71016 4.18985 4.96055 4.17891C5.21093 4.16796 5.45499 4.09686 5.67207 3.97162C5.88915 3.84638 6.07286 3.67069 6.20765 3.45942C6.34244 3.24815 6.42434 3.00752 6.44642 2.7579M10.0004 8.00021C10.0004 9.10473 9.10492 10.0001 8.00029 10.0001C6.89567 10.0001 6.0002 9.10473 6.0002 8.00021C6.0002 6.8957 6.89567 6.00031 8.00029 6.00031C9.10492 6.00031 10.0004 6.8957 10.0004 8.00021Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'ai-ml': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.99923 13.3338V14.6672M7.99923 1.33282V2.66626M11.3328 13.3338V14.6672M11.3328 1.33282V2.66626M1.33203 8.00003H2.66547M1.33203 11.3336H2.66547M1.33203 4.66642H2.66547M13.333 8.00003H14.6664M13.333 11.3336H14.6664M13.333 4.66642H14.6664M4.66563 13.3338V14.6672M4.66563 1.33282V2.66626M3.99891 2.66626H11.9996C12.736 2.66626 13.333 3.26327 13.333 3.9997V12.0003C13.333 12.7368 12.736 13.3338 11.9996 13.3338H3.99891C3.26247 13.3338 2.66547 12.7368 2.66547 12.0003V3.9997C2.66547 3.26327 3.26247 2.66626 3.99891 2.66626ZM5.99907 5.33314H9.99939C10.3676 5.33314 10.6661 5.63165 10.6661 5.99986V10.0002C10.6661 10.3684 10.3676 10.6669 9.99939 10.6669H5.99907C5.63085 10.6669 5.33235 10.3684 5.33235 10.0002V5.99986C5.33235 5.63165 5.63085 5.33314 5.99907 5.33314Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'blockchain': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g clip-path="url(#clip0_1920_18416)">
        <path d="M1.33203 7.99986C1.33172 8.12738 1.36798 8.25232 1.43652 8.35985C1.50506 8.46738 1.603 8.55301 1.71873 8.60656L7.45246 11.2134C7.62528 11.2916 7.8128 11.3321 8.0025 11.3321C8.19221 11.3321 8.37973 11.2916 8.55254 11.2134L14.2729 8.61323C14.391 8.56019 14.491 8.47395 14.5608 8.36504C14.6307 8.25613 14.6673 8.12924 14.6663 7.99986M1.33203 11.3334C1.33172 11.4609 1.36798 11.5858 1.43652 11.6934C1.50506 11.8009 1.603 11.8865 1.71873 11.9401L7.45246 14.5469C7.62528 14.6251 7.8128 14.6656 8.0025 14.6656C8.19221 14.6656 8.37973 14.6251 8.55254 14.5469L14.2729 11.9467C14.391 11.8937 14.491 11.8075 14.5608 11.6986C14.6307 11.5896 14.6673 11.4628 14.6663 11.3334M8.55284 1.45307C8.37912 1.37383 8.19041 1.33282 7.99947 1.33282C7.80853 1.33282 7.61981 1.37383 7.44609 1.45307L1.73236 4.05321C1.61405 4.10538 1.51346 4.19082 1.44285 4.29913C1.37223 4.40744 1.33464 4.53395 1.33464 4.66325C1.33464 4.79255 1.37223 4.91905 1.44285 5.02736C1.51346 5.13568 1.61405 5.22112 1.73236 5.27328L7.45276 7.88009C7.62648 7.95933 7.81519 8.00034 8.00613 8.00034C8.19707 8.00034 8.38579 7.95933 8.55951 7.88009L14.2799 5.27995C14.3982 5.22778 14.4988 5.14234 14.5694 5.03403C14.64 4.92572 14.6776 4.79921 14.6776 4.66992C14.6776 4.54062 14.64 4.41411 14.5694 4.3058C14.4988 4.19749 14.3982 4.11205 14.2799 4.05988L8.55284 1.45307Z" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <defs>
        <clipPath id="clip0_1920_18416">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  'iot': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.99923 13.3328H8.0059M1.33203 5.87926C3.16559 4.23941 5.53926 3.33282 7.99923 3.33282C10.4592 3.33282 12.8329 4.23941 14.6664 5.87926M3.33219 8.57187C4.57848 7.35036 6.25407 6.66616 7.99923 6.66616C9.74439 6.66616 11.42 7.35036 12.6663 8.57187M5.66571 10.9523C6.28886 10.3416 7.12665 9.99949 7.99923 9.99949C8.87181 9.99949 9.70961 10.3416 10.3328 10.9523" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'salesforce': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 3.33292C14 4.43758 11.3137 5.33308 8 5.33308C4.68629 5.33308 2 4.43758 2 3.33292M14 3.33292C14 2.22827 11.3137 1.33276 8 1.33276C4.68629 1.33276 2 2.22827 2 3.33292M14 3.33292V12.667C14 13.1975 13.3679 13.7062 12.2426 14.0813C11.1174 14.4564 9.5913 14.6672 8 14.6672C6.4087 14.6672 4.88258 14.4564 3.75736 14.0813C2.63214 13.7062 2 13.1975 2 12.667V3.33292M2 7.99996C2 8.53044 2.63214 9.03919 3.75736 9.41429C4.88258 9.78939 6.4087 10.0001 8 10.0001C9.5913 10.0001 11.1174 9.78939 12.2426 9.41429C13.3679 9.03919 14 8.53044 14 7.99996" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export const ServicesMenu: React.FC<ServicesMenuProps> = ({ onItemClick }) => {
  // Mobile accordion state for sub-categories
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'web-mobile': true,
    'enterprise-cloud': true,
    'emerging-tech': true,
  });

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    <div className="wk-mega-menu__services">
      {/* Desktop 3-Column + 1 Impact Layout */}
      <div className="wk-mega-menu__services-grid">
        {SERVICES_DATA.map((category, colIdx) => (
          <div
            key={category.id}
            className="wk-mega-menu__col"
            style={{ '--col-stagger': `${(colIdx + 1) * 60}ms` } as React.CSSProperties}
          >
            {/* Desktop Category Title */}
            <div className="wk-mega-menu__col-header">
              <h3 className="wk-mega-menu__col-title">{category.name}</h3>
            </div>

            {/* Mobile Category Accordion Trigger */}
            <button
              type="button"
              className="wk-mega-menu__mobile-cat-trigger"
              onClick={() => toggleCategory(category.id)}
              aria-expanded={openCategories[category.id] ?? false}
            >
              <span>{category.name}</span>
              <svg
                className={`wk-mega-menu__cat-chevron ${openCategories[category.id] ? 'wk-mega-menu__cat-chevron--open' : ''
                  }`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Items List */}
            <div
              className={`wk-mega-menu__items-list ${openCategories[category.id] ? 'wk-mega-menu__items-list--open' : ''
                }`}
            >
              {category.items.map((item, itemIdx) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="wk-mega-menu__item"
                  onClick={(e) => handleLinkClick(e, item.href)}
                  style={{ '--item-stagger': `${colIdx * 40 + itemIdx * 35}ms` } as React.CSSProperties}
                >
                  <div className="wk-mega-menu__service-icon-box" aria-hidden="true">
                    {SERVICE_ICONS[item.id] || (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </div>
                  <div className="wk-mega-menu__item-content">
                    <span className="wk-mega-menu__item-title">{item.title}</span>
                    <p className="wk-mega-menu__item-desc">{item.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Right-Side Impact Panel */}
        <aside className="wk-mega-menu__impact-panel" aria-label="Webkorps Impact Highlights">
          <div className="wk-mega-menu__col-header">
            <h3 className="wk-mega-menu__col-title wk-mega-menu__col-title--impact">{IMPACT_DATA.title}</h3>
          </div>

          <div className="wk-mega-menu__impact-inner">
            <div className="wk-mega-menu__impact-emblem" aria-hidden="true">
              <img
                src={getImgSrc(wekorpsIcon)}
                alt=""
                width={24}
                height={24}
                style={{ display: 'block', width: '24px', height: '24px' }}
              />
            </div>

            <h4 className="wk-mega-menu__impact-headline">{IMPACT_DATA.highlight}</h4>
            <p className="wk-mega-menu__impact-desc">{IMPACT_DATA.description}</p>

            <div className="wk-mega-menu__impact-stats">
              {IMPACT_DATA.stats.map((stat, sIdx) => (
                <div key={sIdx} className="wk-mega-menu__impact-stat-item">
                  <div className="wk-mega-menu__impact-stat-val">{stat.value}</div>
                  <div className="wk-mega-menu__impact-stat-lbl">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

