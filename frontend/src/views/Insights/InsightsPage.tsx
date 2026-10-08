'use client';

import React, { useEffect } from 'react';
import { Header } from '../../sections/home/Header/Header';
import { BottomNavigation } from '../../components/BottomNavigation';
import { FeaturedInsightCard } from './FeaturedInsightCard';
import { ImpactPanel } from './ImpactPanel';
import trendsTechImg from '../../assets/insights/trends-tech.png';
import eventsWebinarsImg from '../../assets/insights/events-webinars.png';
import { updateSEOMetadata } from '../../lib/seo/meta';
import './InsightsPage.css';

export const InsightsPage: React.FC = () => {
  useEffect(() => {
    updateSEOMetadata({
      title: 'Featured Insights | Webkorps — Trends on Modern Technologies & Events',
      description:
        'Explore expert perspectives on AI, cloud, mobile, and enterprise technologies, plus upcoming industry summits, webinars, and networking events.',
      canonicalUrl: 'https://www.webkorps.com/insights',
    });
  }, []);

  const collectionSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Featured Insights — Webkorps',
    description:
      'Expert perspectives on AI, cloud, mobile, and enterprise technologies, and industry events.',
    url: 'https://www.webkorps.com/insights',
    publisher: {
      '@type': 'Organization',
      name: 'Webkorps',
      url: 'https://www.webkorps.com/',
    },
  });

  return (
    <div className="wk-insights-page-wrapper">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: collectionSchema }}
      />

      {/* Accessible skip link */}
      <a href="#main-insights" className="skip-to-content">
        Skip to main content
      </a>

      {/* Global Header */}
      <Header />

      {/* Main Content Area */}
      <main id="main-insights" className="wk-insights-page" tabIndex={-1}>
        <div className="wk-insights-container">
          <header className="wk-insights-page__header">
            <h1 className="wk-insights-page__title">Featured Insights</h1>
          </header>

          <div className="wk-insights-page__grid">
            {/* Left: 2 Side-by-Side Featured Cards */}
            <div className="wk-insights-page__cards">
              <FeaturedInsightCard
                id="trends-modern-tech"
                badge="BLOGS"
                title="Trends on Modern Technologies"
                description="Expert perspectives on AI, cloud, mobile, and enterprise tech."
                image={trendsTechImg}
                imageAlt="Modern workspace with laptop displaying futuristic digital tech hologram"
                ctaText="Explore Blogs"
                href="#insights"
              />

              <FeaturedInsightCard
                id="industry-events-webinars"
                badge="EVENTS"
                title="Industry Events & Webinars"
                description="Stay updated with the latest tech summits, webinars, and networking events."
                image={eventsWebinarsImg}
                imageAlt="Technology conference auditorium with keynote speaker and audience"
                ctaText="View Events"
                href="#events"
              />
            </div>

            {/* Right: Vertical Impact Block */}
            <ImpactPanel />
          </div>
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNavigation isInsightsPage={true} />
    </div>
  );
};

export default InsightsPage;
