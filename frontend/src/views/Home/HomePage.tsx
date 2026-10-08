'use client';

import React, { useEffect } from 'react';
import { Header } from '../../sections/home/Header/Header';
import { Hero } from '../../sections/home/Hero/Hero';
import { LeadingBrands } from '../../sections/home/LeadingBrands/LeadingBrands';
import { Stats } from '../../sections/home/Stats/Stats';
import { AIInnovation } from '../../sections/home/AIInnovation/AIInnovation';
import { Services } from '../../sections/home/Services/Services';
import { Industries } from '../../sections/home/Industries/Industries';
import { Integrations } from '../../sections/home/Integrations/Integrations';
import { Leadership } from '../../sections/home/Leadership/Leadership';
import { CaseStudies } from '../../sections/home/CaseStudies/CaseStudies';
import { TrustedOEMPartners } from '../../sections/home/TrustedOEMPartners/TrustedOEMPartners';
import { NeedPartnerCallout } from '../../sections/home/NeedPartnerCallout/NeedPartnerCallout';
import { Insights } from '../../sections/home/Insights/Insights';
import { FAQ } from '../../sections/home/FAQ/FAQ';
import { Contact } from '../../sections/home/Contact/Contact';
import { Footer } from '../../sections/home/Footer/Footer';
import { BottomNavigation } from '../../components/BottomNavigation';
import { updateSEOMetadata } from '../../lib/seo/meta';
import { getOrganizationSchema, getWebSiteSchema } from '../../lib/structured-data/schema';
import './HomePage.css';

export const HomePage: React.FC = () => {
  useEffect(() => {
    updateSEOMetadata({
      title: 'Webkorps | Building Digital Products That Drive Real Impact',
      description: 'We design, build, and scale digital solutions that help businesses innovate, grow, and stay ahead. Enterprise AI, Web, Mobile & Cloud Engineering.',
      canonicalUrl: 'https://www.webkorps.com/'
    });
  }, []);

  const orgSchema = JSON.stringify(getOrganizationSchema());
  const websiteSchema = JSON.stringify(getWebSiteSchema());

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: orgSchema }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteSchema }}
      />

      {/* Accessible skip link for keyboard & screen reader navigation */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Global Header Navigation */}
      <Header />

      {/* Primary Main Content */}
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <LeadingBrands />
        <Stats />
        <AIInnovation />
        <Services />
        <Industries />
        <Integrations />
        <Leadership />
        <CaseStudies />
        <TrustedOEMPartners />
        <NeedPartnerCallout />
        <Insights />
        <FAQ />
        <Contact />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Floating Bottom Navigation & Expandable Mega-Menu */}
      <BottomNavigation />
    </>
  );
};
