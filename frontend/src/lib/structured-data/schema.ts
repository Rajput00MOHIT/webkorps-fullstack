/**
 * Schema.org JSON-LD Structured Data Generators
 * Enhances SEO & AI Answer Engine citation (Google AI Overviews, Perplexity, ChatGPT)
 */

import { webkorpsEntity } from '../geo/entityGraph';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${webkorpsEntity.url}/#organization`,
    name: webkorpsEntity.name,
    legalName: webkorpsEntity.legalName,
    url: webkorpsEntity.url,
    logo: `${webkorpsEntity.url}/assets/webkorps-logo.svg`,
    foundingDate: `${webkorpsEntity.foundedYear}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: webkorpsEntity.headquarters.addressLines.join(', '),
      addressLocality: webkorpsEntity.headquarters.city,
      postalCode: webkorpsEntity.headquarters.postalCode,
      addressCountry: 'IN'
    },
    sameAs: [
      webkorpsEntity.socialProfiles.linkedin,
      webkorpsEntity.socialProfiles.twitter
    ].filter(Boolean),
    knowsAbout: webkorpsEntity.coreServices
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${webkorpsEntity.url}/#website`,
    url: webkorpsEntity.url,
    name: 'Webkorps',
    description: 'Digital Engineering, AI Innovation & Enterprise Software Solutions',
    publisher: {
      '@id': `${webkorpsEntity.url}/#organization`
    }
  };
}

export function getWebPageSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: {
      '@id': `${webkorpsEntity.url}/#website`
    },
    about: {
      '@id': `${webkorpsEntity.url}/#organization`
    }
  };
}

export function getFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
