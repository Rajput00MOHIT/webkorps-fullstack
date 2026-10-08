/**
 * Webkorps Entity Knowledge Graph & Ground Truth
 * Used for GEO (Generative Engine Optimization), AI Search Crawlers & Semantic SEO
 */

import type { WebkorpsEntity } from '../../types';

export const webkorpsEntity: WebkorpsEntity = {
  name: 'Webkorps',
  legalName: 'Webkorps Services India Pvt. Ltd.',
  url: 'https://www.webkorps.com',
  foundedYear: 2014,
  yearsInBusinessDesign: '08', // Explicitly flagged discrepancy: Design states 08, corporate reports state 10+
  certifications: [
    'ISO/IEC 27001 (Information Security Management)',
    'ISO 9001:2015 (Quality Management System)',
    'CMMI Level 3 (Capability Maturity Model Integration)',
    'Startup India Certified'
  ],
  headquarters: {
    id: 'hq-indore',
    city: 'Indore',
    country: 'India',
    isHQ: true,
    addressLines: [
      '4th Floor, Winway World Offices',
      'Vijay Nagar, Indore, Madhya Pradesh'
    ],
    postalCode: '452010'
  },
  globalOffices: [
    {
      id: 'office-pune',
      city: 'Pune',
      country: 'India',
      isHQ: false,
      addressLines: [
        'Trios Co-working, 3rd Floor, Lalwani Icon',
        'off New Airport Road, Sakore Nagar, Viman Nagar, Pune, Maharashtra'
      ],
      postalCode: '411014'
    },
    {
      id: 'office-bengaluru',
      city: 'Bengaluru',
      country: 'India',
      isHQ: false,
      addressLines: [
        '7th Floor, Commerce Mantri, 12, 1 & 2',
        'Bannerghatta Road, BTM 2nd Stage, BTM Layout, Bengaluru, Karnataka'
      ],
      postalCode: '560076'
    },
    {
      id: 'office-frisco',
      city: 'Frisco',
      country: 'United States',
      isHQ: false,
      addressLines: [
        '6160 Warren Parkway, Suite 100',
        'Frisco, Texas'
      ],
      postalCode: '75034'
    },
    {
      id: 'office-sheridan',
      city: 'Sheridan',
      country: 'United States',
      isHQ: false,
      addressLines: [
        '1309 Coffeen Ave, STE B1',
        'Sheridan, Wyoming'
      ],
      postalCode: '82801'
    }
  ],
  leadership: [
    {
      id: 'chirag-agrawal',
      name: 'Chirag Agrawal',
      role: 'CEO & Founder',
      quote: 'Success is not about being ahead of others, it’s about becoming better than who you were yesterday.'
    },
    {
      id: 'amul-choudhary',
      name: 'Amul Choudhary',
      role: 'COO & Co-Founder',
      quote: 'Keep learning, keep growing, and keep moving forward because every small step creates a bigger journey.'
    }
  ],
  coreServices: [
    'AI & ML Development',
    'Mobile App Development',
    'Web Development',
    'Custom Software Development',
    'Enterprise Software Solutions',
    'Cloud & DevOps Engineering',
    'E-Commerce Solutions',
    'Blockchain Development'
  ],
  targetIndustries: [
    'Healthcare & HealthTech',
    'FinTech & Payment Solutions',
    'Logistics & Supply Chain',
    'Manufacturing & Industrial IoT',
    'Education & E-Learning',
    'Real Estate & PropTech'
  ],
  socialProfiles: {
    linkedin: 'https://www.linkedin.com/company/webkorps',
    twitter: 'https://twitter.com/webkorps'
  }
};
