'use client';

import React from 'react';
import techSpotlightImg from '../../assets/technologies/tech-spotlight.png';
import { getImgSrc } from '../../utils/image';

interface TechnologiesMenuProps {
  onItemClick?: () => void;
}

interface TechnologyCardItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

const TECHNOLOGIES_LIST: TechnologyCardItem[] = [
  {
    id: 'dotnet',
    title: '.NET',
    description: 'Building scalable and robust enterprise web solutions',
    href: '#integrations',
  },
  {
    id: 'python',
    title: 'Python',
    description: 'Powering AI, data science, and web applications',
    href: '#integrations',
  },
  {
    id: 'java',
    title: 'Java',
    description: 'Secure, high-performance applications for diverse platforms',
    href: '#integrations',
  },
  {
    id: 'dotnet-enterprise',
    title: '.NET Enterprise',
    description: 'Custom enterprise solutions built on the .NET framework',
    href: '#integrations',
  },
  {
    id: 'android',
    title: 'Android',
    description: 'Creating seamless mobile experiences for Android users',
    href: '#integrations',
  },
  {
    id: 'react-native',
    title: 'React Native',
    description: 'High-quality cross-platform mobile apps from a single codebase',
    href: '#integrations',
  },
  {
    id: 'ios',
    title: 'IOS',
    description: 'Innovative iOS solutions for Apple devices',
    href: '#integrations',
  },
  {
    id: 'php',
    title: 'PHP',
    description: 'Reliable and scalable web applications for global reach',
    href: '#integrations',
  },
];

function renderTechIcon(id: string) {
  switch (id) {
    case 'dotnet':
    case 'dotnet-enterprise':
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#1887C9',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          .NET
        </span>
      );
    case 'python':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 7.5H7.5M7.5 7.5H5.978C5.171 7.5 4.345 7.688 3.848 8.324C3.318 9.003 2.75 10.159 2.75 12C2.75 13.84 3.318 14.997 3.848 15.676C4.345 16.312 5.171 16.5 5.978 16.5H7.5M7.5 7.5V5.978C7.5 5.171 7.688 4.345 8.324 3.848C9.003 3.318 10.159 2.75 12 2.75C13.84 2.75 14.997 3.318 15.676 3.848C16.312 4.345 16.5 5.171 16.5 5.978V7.5M12 16.5H16.5M16.5 16.5H18.021C18.828 16.5 19.655 16.312 20.151 15.676C20.682 14.997 21.25 13.841 21.25 12C21.25 10.16 20.682 9.003 20.152 8.324C19.655 7.688 18.828 7.5 18.022 7.5H16.5M16.5 16.5V18.021C16.5 18.828 16.312 19.655 15.676 20.151C14.997 20.682 13.841 21.25 12 21.25C10.16 21.25 9.003 20.682 8.324 20.152C7.688 19.655 7.5 18.828 7.5 18.022V16.5M16.5 7.5V10C16.5 10.5304 16.2893 11.0391 15.9142 11.4142C15.5391 11.7893 15.0304 12 14.5 12H9.5C8.96957 12 8.46086 12.2107 8.08579 12.5858C7.71071 12.9609 7.5 13.4696 7.5 14V16.5" stroke="#1A87C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 18.5C15 18.6989 14.921 18.8897 14.7803 19.0303C14.6397 19.171 14.4489 19.25 14.25 19.25C14.0511 19.25 13.8603 19.171 13.7197 19.0303C13.579 18.8897 13.5 18.6989 13.5 18.5C13.5 18.3011 13.579 18.1103 13.7197 17.9697C13.8603 17.829 14.0511 17.75 14.25 17.75C14.4489 17.75 14.6397 17.829 14.7803 17.9697C14.921 18.1103 15 18.3011 15 18.5ZM9 5.5C9 5.30109 9.07902 5.11032 9.21967 4.96967C9.36032 4.82902 9.55109 4.75 9.75 4.75C9.94891 4.75 10.1397 4.82902 10.2803 4.96967C10.421 5.11032 10.5 5.30109 10.5 5.5C10.5 5.69891 10.421 5.88968 10.2803 6.03033C10.1397 6.17098 9.94891 6.25 9.75 6.25C9.55109 6.25 9.36032 6.17098 9.21967 6.03033C9.07902 5.88968 9 5.69891 9 5.5Z" fill="#1A87C8" />
        </svg>
      );
    case 'java':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6.17538 10.333C4.96738 10.741 4.22037 11.304 4.22037 11.926C4.22037 12.774 5.60937 13.513 7.66037 13.897C6.89837 14.282 6.44337 14.771 6.44337 15.304C6.44337 16.547 8.93037 17.556 11.9984 17.556C12.7884 17.556 13.5404 17.489 14.2214 17.368M7.66138 13.897C8.61638 14.076 9.71637 14.177 10.8874 14.177C12.5954 14.177 14.1524 13.961 15.3324 13.605M16.4424 10.125C15.0314 10.541 13.0634 10.8 10.8874 10.8C6.59237 10.8 3.10938 9.79197 3.10938 8.54797C3.10938 7.58797 5.18637 6.76797 8.10938 6.44397" stroke="#1887C9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 19.07C22 20.688 17.523 22 12 22C6.477 22 2 20.688 2 19.07C2 17.92 3.707 16.924 7 16.444" stroke="#1887C9" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18.7596 8.788C22.9736 7.694 23.5756 14.256 17.5546 16.444M17.5576 2C16.8176 2.123 15.4246 2.815 15.7796 4.593C16.1356 6.37 15.6316 7.309 15.3356 7.556M13.1126 2C12.3716 2.148 10.9786 2.978 11.3346 5.111C11.6906 7.244 11.1866 7.815 10.8906 8.111" stroke="#1887C9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'android':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M8.125 11.875C8.125 10.0516 8.84933 8.30295 10.1386 7.01364C11.428 5.72433 13.1766 5 15 5C16.8234 5 18.572 5.72433 19.8614 7.01364C21.1507 8.30295 21.875 10.0516 21.875 11.875V20C21.875 21.7675 21.875 22.6512 21.325 23.2C20.7762 23.75 19.8925 23.75 18.125 23.75H11.875C10.1075 23.75 9.22375 23.75 8.675 23.2C8.125 22.6512 8.125 21.7675 8.125 20V11.875Z" stroke="#1887C9" strokeWidth="2" />
          <path d="M25 13.75V21.25M18.75 23.75V27.5M11.25 23.75V27.5M5 13.75V21.25M12.5 5L10.625 2.5M17.5 5L19.375 2.5M8.125 12.5H21.875" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'react-native':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12.9995 11.9999C12.9995 12.5522 12.5518 12.9999 11.9995 12.9999C11.4472 12.9999 10.9995 12.5522 10.9995 11.9999C10.9995 11.4477 11.4472 10.9999 11.9995 10.9999C12.5518 10.9999 12.9995 11.4477 12.9995 11.9999ZM20.1994 20.2003C22.2394 18.1703 20.2194 12.8403 15.6994 8.30031C11.1594 3.78031 5.8294 1.76031 3.7994 3.80031C1.7594 5.83031 3.7794 11.1603 8.2994 15.7003C12.8394 20.2203 18.1694 22.2403 20.1994 20.2003ZM15.6994 15.7003C20.2194 11.1603 22.2394 5.83031 20.1994 3.80031C18.1694 1.76031 12.8394 3.78031 8.2994 8.30031C3.7794 12.8403 1.7594 18.1703 3.7994 20.2003C5.8294 22.2403 11.1594 20.2203 15.6994 15.7003Z" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'ios':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12.0007 6.52738V2.9992C12.0007 2.73397 12.1061 2.4796 12.2936 2.29205C12.4812 2.10451 12.7356 1.99915 13.0008 1.99915M12.0007 6.52738C12.8641 5.75518 13.9325 5.24923 15.077 5.07087C16.2216 4.89251 17.3932 5.04921 18.4506 5.52208C19.508 5.99494 20.406 6.76375 21.0361 7.73569C21.6661 8.70764 22.0014 9.84117 22.0015 10.9995C22.0171 14.6819 20.6776 18.2414 18.2382 21C17.7905 21.5009 17.1875 21.837 16.5261 21.9545C15.8646 22.072 15.1828 21.9641 14.5899 21.648C13.7931 21.2229 12.9039 21.0005 12.0007 21.0005C11.0976 21.0005 10.2084 21.2229 9.41156 21.648C8.8187 21.9641 8.13692 22.072 7.47543 21.9545C6.81394 21.837 6.21103 21.5009 5.76329 21C3.33198 18.2365 1.99371 14.6802 2.00002 10.9995C2.00005 9.84117 2.33534 8.70764 2.96542 7.73569C3.5955 6.76375 4.49344 5.99494 5.55085 5.52208C6.60826 5.04921 7.77993 4.89251 8.92445 5.07087C10.069 5.24923 11.1374 5.75518 12.0007 6.52738Z" stroke="#1887C9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'php':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="29" height="29" viewBox="0 0 29 29" fill="none">
          <path d="M2.59867 20.2759H4.49575C4.53673 20.2763 4.57646 20.2618 4.60758 20.2351C4.63869 20.2085 4.65906 20.1714 4.66492 20.1309L5.08783 17.9317H6.562C7.17907 17.9467 7.7947 17.8652 8.38658 17.69C8.86589 17.5311 9.30353 17.2668 9.66742 16.9167C9.99364 16.6228 10.2674 16.2755 10.477 15.8896C10.6844 15.5121 10.8312 15.1044 10.912 14.6813C11.0404 14.2379 11.0624 13.7705 10.9763 13.317C10.8903 12.8636 10.6985 12.4368 10.4166 12.0713C10.0899 11.7394 9.6946 11.483 9.25832 11.3202C8.82203 11.1574 8.35539 11.092 7.89117 11.1288H4.26617C4.22268 11.1307 4.18113 11.1473 4.14824 11.1758C4.11534 11.2043 4.09303 11.2431 4.08492 11.2859L2.41742 20.0584C2.39992 20.1093 2.39992 20.1645 2.41742 20.2154C2.44047 20.2394 2.46902 20.2575 2.50059 20.268C2.53216 20.2785 2.56582 20.2812 2.59867 20.2759ZM6.04242 12.8325H7.25075C7.48064 12.8016 7.71437 12.8167 7.93839 12.8769C8.16241 12.937 8.37225 13.0411 8.55575 13.1829C8.76117 13.4004 8.79742 13.8113 8.68867 14.3913C8.62913 14.9105 8.38463 15.3909 7.99992 15.7446C7.52135 16.0476 6.95753 16.1875 6.39283 16.1434H5.42617L6.04242 12.8325ZM17.8841 11.6846C17.2299 11.2037 16.4199 10.9839 15.6124 11.0684H14.1745L14.5733 8.94169C14.585 8.91719 14.5912 8.89034 14.5912 8.86315C14.5912 8.83596 14.585 8.80911 14.5733 8.78461C14.5303 8.7689 14.4832 8.7689 14.4403 8.78461H12.5433C12.5023 8.78419 12.4625 8.79866 12.4314 8.82533C12.4003 8.85199 12.3799 8.88905 12.3741 8.92961L10.7066 17.7142C10.6949 17.7366 10.6889 17.7615 10.6889 17.7867C10.6889 17.8119 10.6949 17.8368 10.7066 17.8592C10.7208 17.8815 10.7405 17.8998 10.7637 17.9125C10.787 17.9252 10.813 17.9318 10.8395 17.9317H12.7003C12.7432 17.9318 12.7845 17.9156 12.8159 17.8865C12.8473 17.8573 12.8664 17.8173 12.8695 17.7746L13.7999 12.8567H15.1412C15.6849 12.8567 15.8783 12.9775 15.9387 13.05C15.9885 13.1686 16.0142 13.296 16.0142 13.4246C16.0142 13.5533 15.9885 13.6806 15.9387 13.7992L15.2016 17.7142C15.1899 17.7366 15.1839 17.7615 15.1839 17.7867C15.1839 17.8119 15.1899 17.8368 15.2016 17.8592C15.2166 17.8808 15.2364 17.8986 15.2595 17.9111C15.2825 17.9237 15.3082 17.9308 15.3345 17.9317H17.2195C17.263 17.9297 17.3045 17.9132 17.3374 17.8847C17.3703 17.8561 17.3926 17.8174 17.4008 17.7746L18.1741 13.6663C18.2989 13.3387 18.3377 12.9846 18.287 12.6377C18.2362 12.2908 18.0975 11.9627 17.8841 11.6846ZM23.3457 11.0684H19.5637C19.5414 11.0667 19.5191 11.0695 19.498 11.0765C19.4768 11.0835 19.4572 11.0946 19.4404 11.1092C19.4235 11.1238 19.4098 11.1416 19.3998 11.1615C19.3899 11.1815 19.3839 11.2032 19.3824 11.2254L17.6182 20.0584C17.6073 20.0831 17.6016 20.1098 17.6016 20.1369C17.6016 20.164 17.6073 20.1907 17.6182 20.2154C17.6345 20.2348 17.6549 20.2503 17.6779 20.2607C17.7009 20.2712 17.7259 20.2764 17.7512 20.2759H19.7208C19.7638 20.2794 19.8065 20.2663 19.8402 20.2393C19.8739 20.2124 19.896 20.1736 19.902 20.1309L20.3491 17.9317H21.8837C22.5205 17.9453 23.1558 17.8639 23.7687 17.69C24.2963 17.5433 24.7837 17.2789 25.1945 16.9167C25.532 16.6241 25.8179 16.2769 26.0403 15.8896C26.2502 15.512 26.401 15.1045 26.4874 14.6813C26.6191 14.2375 26.6418 13.7685 26.5534 13.3141C26.4651 12.8597 26.2683 12.4334 25.9799 12.0713C25.6387 11.7246 25.2268 11.4555 24.7722 11.2824C24.3177 11.1094 23.8311 11.0363 23.3457 11.0684ZM24.0949 14.4154C24.0226 14.9387 23.7655 15.4187 23.3699 15.7688C22.8741 16.0732 22.2946 16.2127 21.7145 16.1675H20.7478L21.4003 12.8325H22.6087C23.0917 12.7733 23.5793 12.8985 23.9741 13.1829C24.1674 13.4004 24.1674 13.8113 24.0949 14.4154Z" fill="#1887C9" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export const TechnologiesMenu: React.FC<TechnologiesMenuProps> = ({ onItemClick }) => {
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
    <div className="wk-mega-menu__tech-layout">
      {/* Left: 2-Column Technology Grid (8 Cards) */}
      <div className="wk-mega-menu__tech-grid">
        {TECHNOLOGIES_LIST.map((tech, idx) => (
          <a
            key={tech.id}
            href={tech.href}
            className="wk-mega-menu__tech-card"
            onClick={(e) => handleLinkClick(e, tech.href)}
            style={{ '--item-stagger': `${idx * 25}ms` } as React.CSSProperties}
          >
            <div className="wk-mega-menu__tech-icon-box" aria-hidden="true">
              {renderTechIcon(tech.id)}
            </div>
            <div className="wk-mega-menu__tech-info">
              <span className="wk-mega-menu__tech-title">{tech.title}</span>
              <p className="wk-mega-menu__tech-desc">{tech.description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Right: Tech Spotlight Card */}
      <aside className="wk-mega-menu__tech-spotlight" aria-label="Tech Spotlight">
        <img
          src={getImgSrc(techSpotlightImg)}
          alt="Cutting-Edge Technologies Powering Future Business"
          className="wk-mega-menu__tech-spotlight-img"
          width={340}
          height={165}
          loading="eager"
        />
        <div className="wk-mega-menu__tech-spotlight-content">
          <span className="wk-mega-menu__tech-spotlight-badge">TECH SPOTLIGHT</span>
          <h4 className="wk-mega-menu__tech-spotlight-title">
            Cutting-Edge Technologies Powering Future Business
          </h4>
          <p className="wk-mega-menu__tech-spotlight-desc">
            Discover how our stack enabling AI, cloud-first engineering, and secure mobile solutions is reshaping global industries.
          </p>
          <a
            href="#integrations"
            className="wk-mega-menu__tech-spotlight-link"
            onClick={(e) => handleLinkClick(e, '#integrations')}
          >
            <span>Read More</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </aside>
    </div>
  );
};
