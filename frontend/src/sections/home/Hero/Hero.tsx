'use client';

import React from 'react';
import cardImage from '../../../assets/cardimage.png';
import { getImgSrc } from '../../../utils/image';
import './Hero.css';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: 'web-dev',
    title: 'Web Development',
    description: 'Fast, scalable web solutions.',
    href: '#services-web',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
        <path d="M1.29167 6.16667H19.7083M0.75 10.5C0.75 5.90342 0.75 3.60567 2.17783 2.17783C3.60567 0.75 5.9045 0.75 10.5 0.75C15.0955 0.75 17.3943 0.75 18.8222 2.17783C20.25 3.60567 20.25 5.9045 20.25 10.5C20.25 15.0955 20.25 17.3943 18.8222 18.8222C17.3943 20.25 15.0955 20.25 10.5 20.25C5.9045 20.25 3.60567 20.25 2.17783 18.8222C0.75 17.3943 0.75 15.0955 0.75 10.5Z" stroke="#1887C9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7.79232 10.5L6.13157 11.9322C5.43282 12.5334 5.08398 12.8346 5.08398 13.2083C5.08398 13.5821 5.43282 13.8833 6.13157 14.4845L7.79232 15.9167M13.209 10.5L14.8697 11.9322C15.5685 12.5334 15.9173 12.8346 15.9173 13.2083C15.9173 13.5821 15.5685 13.8833 14.8697 14.4845L13.209 15.9167" stroke="#1887C9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    )
  },
  {
    id: 'mobile-dev',
    title: 'Mobile App Development',
    description: 'Seamless apps for every platform.',
    href: '#services-mobile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="23" viewBox="0 0 17 23" fill="none">
        <path d="M8.33398 18.6112L8.34398 18.6005" stroke="#1A87C8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M14.834 17.551V21.1213C14.834 21.204 14.8172 21.2859 14.7845 21.3624C14.7518 21.4388 14.704 21.5083 14.6436 21.5668C14.5832 21.6253 14.5116 21.6717 14.4327 21.7033C14.3539 21.735 14.2693 21.7513 14.184 21.7513H2.48398C2.39863 21.7513 2.3141 21.735 2.23524 21.7033C2.15638 21.6717 2.08472 21.6253 2.02436 21.5668C1.96401 21.5083 1.91613 21.4388 1.88346 21.3624C1.8508 21.2859 1.83398 21.204 1.83398 21.1213V17.551M14.834 4.95026V1.38004C14.834 1.21294 14.7655 1.05269 14.6436 0.934534C14.5217 0.816379 14.3564 0.75 14.184 0.75H2.48398C2.31159 0.75 2.14626 0.816379 2.02436 0.934534C1.90247 1.05269 1.83398 1.21294 1.83398 1.38004V4.95026" stroke="#1A87C8" stroke-width="1.5" stroke-linecap="round" />
        <path d="M12.125 7.5748L15.9167 11.25L12.125 14.9253M4.54167 7.5748L0.75 11.25L4.54167 14.9253" stroke="#1A87C8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    )
  },
  {
    id: 'ai-ml',
    title: 'AI & ML Development',
    description: 'Smart solutions powered by AI.',
    href: '#services-ai-ml',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21.4375 13.8125C22.7814 13.8125 23.875 12.7189 23.875 11.375C23.875 10.0311 22.7814 8.9375 21.4375 8.9375C20.935 8.93899 20.4453 9.096 20.0357 9.38696C19.626 9.67791 19.3164 10.0886 19.1495 10.5625H14.4614L20.3926 4.63125C20.7111 4.78319 21.0621 4.875 21.4375 4.875C22.7814 4.875 23.875 3.78137 23.875 2.4375C23.875 1.09362 22.7814 0 21.4375 0C20.0936 0 19 1.09362 19 2.4375C19 2.81288 19.0926 3.16387 19.2437 3.48156L12.5 10.2261V4.875C12.5 3.97962 13.2288 3.25 14.125 3.25H15.75V1.625H14.125C13.15 1.625 12.2839 2.06619 11.6875 2.74787C11.3853 2.39712 11.0113 2.11536 10.5907 1.92164C10.1702 1.72792 9.71299 1.62676 9.25 1.625H8.4375C4.40588 1.625 1.125 4.90506 1.125 8.9375V12.1875H2.75V9.75H5.1875C6.53137 9.75 7.625 8.65637 7.625 7.3125V5.6875H6V7.3125C6 7.52799 5.9144 7.73465 5.76202 7.88702C5.60965 8.0394 5.40299 8.125 5.1875 8.125H2.815C3.2115 5.37306 5.5775 3.25 8.4375 3.25H9.25C10.1462 3.25 10.875 3.97962 10.875 4.875V8.125H9.25V9.75H10.875V17.875C10.875 19.6674 12.3326 21.125 14.125 21.125H15.75V19.5H14.125C13.2288 19.5 12.5 18.7712 12.5 17.875V12.5239L19.2437 19.2684C19.0918 19.5861 19 19.9371 19 20.3125C19 21.6572 20.0936 22.75 21.4375 22.75C22.7814 22.75 23.875 21.6572 23.875 20.3125C23.875 18.9678 22.7814 17.875 21.4375 17.875C21.0755 17.8769 20.7186 17.9605 20.3934 18.1196L14.4614 12.1883H19.1495C19.3166 12.6621 19.6262 13.0726 20.0358 13.3634C20.4455 13.6542 20.9351 13.8111 21.4375 13.8125ZM21.4375 10.5625C21.653 10.5625 21.8597 10.6481 22.012 10.8005C22.1644 10.9528 22.25 11.1595 22.25 11.375C22.25 11.5905 22.1644 11.7972 22.012 11.9495C21.8597 12.1019 21.653 12.1875 21.4375 12.1875C21.222 12.1875 21.0153 12.1019 20.863 11.9495C20.7106 11.7972 20.625 11.5905 20.625 11.375C20.625 11.1595 20.7106 10.9528 20.863 10.8005C21.0153 10.6481 21.222 10.5625 21.4375 10.5625ZM21.4375 1.625C21.6467 1.63436 21.8442 1.72405 21.989 1.8754C22.1337 2.02675 22.2145 2.22809 22.2145 2.4375C22.2145 2.64691 22.1337 2.84825 21.989 2.9996C21.8442 3.15095 21.6467 3.24064 21.4375 3.25C21.222 3.25 21.0153 3.1644 20.863 3.01202C20.7106 2.85965 20.625 2.65299 20.625 2.4375C20.625 2.22201 20.7106 2.01535 20.863 1.86298C21.0153 1.7106 21.222 1.625 21.4375 1.625ZM21.4375 19.5C21.6467 19.5094 21.8442 19.599 21.989 19.7504C22.1337 19.9017 22.2145 20.1031 22.2145 20.3125C22.2145 20.5219 22.1337 20.7233 21.989 20.8746C21.8442 21.026 21.6467 21.1156 21.4375 21.125C21.222 21.125 21.0153 21.0394 20.863 20.887C20.7106 20.7347 20.625 20.528 20.625 20.3125C20.625 20.097 20.7106 19.8903 20.863 19.738C21.0153 19.5856 21.222 19.5 21.4375 19.5Z" fill="#1A87C8" />
        <path d="M1.875 14.1875V16.0625H6.17438L0 22.2369L1.32563 23.5625L7.5 17.3881V21.6875H9.375V14.1875H1.875Z" fill="#1887C9" />
      </svg>
    )
  },
  {
    id: 'enterprise-software',
    title: 'Enterprise Software',
    description: 'Scalable solutions for complex needs.',
    href: '#services-enterprise',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 22 24" fill="none">
        <path d="M4.875 4.06274H3.25V12.1877H4.875V4.06274ZM20.722 5.79824L10.972 0.110741C10.8477 0.0382162 10.7064 0 10.5625 0C10.4186 0 10.2773 0.0382162 10.153 0.110741L6.903 2.00712C6.78045 2.07863 6.67876 2.18099 6.60806 2.30401C6.53736 2.42702 6.5001 2.56641 6.5 2.7083V9.75024H8.125V3.17549L10.5625 1.75362L19.5 6.96662V9.75024H21.125V6.50024C21.125 6.35821 21.0879 6.21866 21.0171 6.09548C20.9464 5.97231 20.8447 5.86982 20.722 5.79824ZM1.62419 17.4137V6.50024H3.56815e-08V17.8801C-4.205e-05 18.0221 0.0371462 18.1617 0.107857 18.2849C0.178568 18.408 0.280331 18.5105 0.403 18.5821L8.93181 23.5627L9.75 22.1587L1.62419 17.4137ZM15.4375 21.1252H17.0625V13.0002H15.4375V21.1252ZM19.5 21.1252H21.125V16.2502H19.5V21.1252ZM11.375 21.1252H13V14.6252H11.375V21.1252Z" fill="#1A87C8" />
      </svg>
    )
  },
  {
    id: 'cloud-devops',
    title: 'Cloud & DevOps',
    description: 'Secure, scalable cloud infrastructure.',
    href: '#services-cloud',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18" fill="none">
        <path d="M4.27753 7.64338C3.25293 7.9012 2.35774 8.5243 1.76014 9.3956C1.16255 10.2669 0.90369 11.3264 1.0322 12.3751C1.16071 13.4238 1.66774 14.3895 2.45804 15.0908C3.24833 15.792 4.26749 16.1805 5.32403 16.1833H17.2407C18.0056 16.1828 18.7617 16.0203 19.4592 15.7065C20.1568 15.3927 20.7799 14.9347 21.2877 14.3627C21.7955 13.7907 22.1764 13.1177 22.4054 12.3879C22.6343 11.6581 22.7061 10.888 22.616 10.1285C22.5258 9.36894 22.2759 8.63708 21.8826 7.98109C21.4892 7.32511 20.9614 6.75986 20.3339 6.32256C19.7063 5.88526 18.9933 5.58582 18.2417 5.44395C17.4901 5.30208 16.717 5.321 15.9732 5.49946L14.5324 5.89163" stroke="#1A87C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M15.9736 5.49945C15.6033 4.03324 14.6894 2.76267 13.4171 1.94532C12.1447 1.12796 10.6092 0.82497 9.12179 1.09777C7.63436 1.37056 6.3063 2.19874 5.40683 3.41441C4.50737 4.63007 4.1038 6.14227 4.27793 7.64445C4.27793 7.64445 4.44368 8.59995 4.78277 9.14162" stroke="#1A87C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    )
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce Solutions',
    description: 'Digital experiences built to convert.',
    href: '#services-ecommerce',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M8.87492 7.25C8.87492 6.48408 8.29317 1.53217 12.9352 1.53217C17.5622 1.53217 16.9999 6.58808 16.9999 7.25M20.0354 8.628C20.0261 8.27576 19.8861 7.93958 19.6426 7.68488C19.3991 7.43017 19.0695 7.27516 18.7181 7.25H7.15567C6.80413 7.2747 6.47444 7.4296 6.23103 7.68443C5.98762 7.93926 5.84799 8.2757 5.83942 8.628L4.0075 20.1742C3.97499 20.3733 3.9838 20.5769 4.03339 20.7725C4.08298 20.968 4.17229 21.1513 4.29576 21.3108C4.41923 21.4704 4.57421 21.6028 4.75107 21.6998C4.92792 21.7969 5.12286 21.8565 5.32375 21.875H20.55C20.751 21.8567 20.946 21.7971 21.123 21.7001C21.3 21.6031 21.4551 21.4707 21.5787 21.3112C21.7023 21.1516 21.7917 20.9683 21.8413 20.7727C21.891 20.5771 21.8998 20.3734 21.8673 20.1742L20.0354 8.628Z" stroke="#1A87C8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M14.725 11.3125H12.5226C12.1851 11.3127 11.8581 11.4304 11.5979 11.6453C11.3376 11.8603 11.1602 12.1591 11.0962 12.4905C11.0321 12.8219 11.0854 13.1652 11.2468 13.4616C11.4082 13.7581 11.6678 13.9891 11.9809 14.1151L14.2169 15.0088C14.5308 15.1344 14.791 15.3654 14.953 15.662C15.115 15.9587 15.1685 16.3026 15.1044 16.6344C15.0403 16.9663 14.8625 17.2655 14.6017 17.4805C14.3409 17.6955 14.0133 17.8129 13.6753 17.8125H11.475M13.1 11.3125V10.5M13.1 18.625V17.8125M0.75 4V2.375C0.75 1.94402 0.921205 1.5307 1.22595 1.22595C1.5307 0.921205 1.94402 0.75 2.375 0.75H4M25.125 4V2.375C25.125 1.94402 24.9538 1.5307 24.649 1.22595C24.3443 0.921205 23.931 0.75 23.5 0.75H21.875M0.75 21.875V23.5C0.75 23.931 0.921205 24.3443 1.22595 24.649C1.5307 24.9538 1.94402 25.125 2.375 25.125H4M25.125 21.875V23.5C25.125 23.931 24.9538 24.3443 24.649 24.649C24.3443 24.9538 23.931 25.125 23.5 25.125H21.875" stroke="#1A87C8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    )
  }
];

export const Hero: React.FC = () => {
  return (
    <section className="wk-hero" aria-labelledby="hero-heading">
      <div className="site-container">
        {/* Centered Top Value Proposition */}
        <div className="wk-hero__content">
          <h1 id="hero-heading" className="wk-hero__title">
            Building Digital Products
            <br />
            That <span className="wk-hero__title-accent">Drive Real Impact</span>
          </h1>

          <p className="wk-hero__subtitle">
            We design, build, and scale digital solutions that help businesses{' '}
            <br className="wk-hero__br-desktop" />
            innovate, grow, and stay ahead.
          </p>

          <div className="wk-hero__actions">
            <button
              type="button"
              className="wk-hero__btn-secondary"
              onClick={() => {
                const el = document.getElementById('about');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Watch how it works
            </button>

            <a href="#contact" className="wk-hero__btn-primary">
              <span>Start a Project</span>
              <span className="wk-hero__btn-icon-circle" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 19 18" fill="none">
                  <path d="M10.3361 17.1441L8.6823 15.5087L14.4246 9.76644H0V7.37766H14.4246L8.6823 1.64459L10.3361 0L18.9081 8.57205L10.3361 17.1441Z" fill="#1887C9" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        {/* Feature Explorer Card */}
        <div className="wk-hero__card" role="region" aria-label="Explore Services Feature">
          {/* Left Column: Visual Acrylic Puzzle Image */}
          <div className="wk-hero__card-visual">
            <img
              src={getImgSrc(cardImage)}
              alt="Hands connecting precision blue puzzle pieces representing collaborative digital engineering"
              className="wk-hero__card-image"
              width={420}
              height={380}
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Right Column: Services Directory Grid */}
          <div className="wk-hero__card-content">
            <div className="wk-hero__card-header">
              <h2 className="wk-hero__card-title">Explore services</h2>
              <a href="#services" className="wk-hero__card-explore-all">
                <span>Explore all services</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M0 14.1067L6.10667 8L0 1.88L1.88 0L9.88 8L1.88 16L0 14.1067Z" fill="#1887C9" />
                </svg>
              </a>
            </div>

            <div className="wk-hero__services-grid">
              {SERVICES.map((service) => (
                <a
                  key={service.id}
                  href={service.href}
                  className="wk-hero__service-item"
                >
                  <div className="wk-hero__service-icon" aria-hidden="true">
                    {service.icon}
                  </div>
                  <h3 className="wk-hero__service-name">{service.title}</h3>
                  <p className="wk-hero__service-desc">{service.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
