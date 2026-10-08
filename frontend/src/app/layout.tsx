import type { Metadata, Viewport } from 'next';
import React from 'react';

// Design Tokens & Base Styles
import '../styles/tokens.css';
import '../styles/globals.css';
import '../styles/utilities.css';

// Component Styles
import '../components/Badge/Badge.css';
import '../components/Button/Button.css';
import '../components/Card/Card.css';
import '../components/Container/Container.css';
import '../components/SectionHeading/SectionHeading.css';
import '../components/BottomNavigation/BottomNavigation.css';
import '../components/AIAssistant/AIAssistant.css';

// Section Styles in Strict Visual Order
import '../sections/home/Header/Header.css';
import '../sections/home/Hero/Hero.css';
import '../sections/home/LeadingBrands/LeadingBrands.css';
import '../sections/home/Stats/Stats.css';
import '../sections/home/AIInnovation/AIInnovation.css';
import '../sections/home/Services/Services.css';
import '../sections/home/Industries/Industries.css';
import '../sections/home/Integrations/Integrations.css';
import '../sections/home/Leadership/Leadership.css';
import '../sections/home/CaseStudies/CaseStudies.css';
import '../sections/home/TrustedOEMPartners/TrustedOEMPartners.css';
import '../sections/home/NeedPartnerCallout/NeedPartnerCallout.css';
import '../sections/home/Insights/Insights.css';
import '../sections/home/FAQ/FAQ.css';
import '../sections/home/Contact/Contact.css';
import '../sections/home/Footer/Footer.css';
import '../views/Home/HomePage.css';

import { Inter, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-family-sans',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-family-heading',
});

export const metadata: Metadata = {
  title: 'Webkorps | Digital Engineering, AI Innovation & Enterprise Software Solutions',
  description: 'Webkorps designs, builds, and scales digital products, AI solutions, and enterprise software that drive real business impact. Certified ISO 27001, CMMI Level 3.',
  metadataBase: new URL('https://www.webkorps.com/'),
  alternates: {
    canonical: 'https://www.webkorps.com/',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.webkorps.com/',
    title: 'Webkorps | Digital Engineering, AI Innovation & Enterprise Software Solutions',
    description: 'We design, build, and scale digital products and AI solutions that help businesses innovate, grow, and stay ahead.',
    siteName: 'Webkorps',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Webkorps | Digital Engineering, AI Innovation & Enterprise Software Solutions',
    description: 'We design, build, and scale digital products and AI solutions that help businesses innovate, grow, and stay ahead.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
