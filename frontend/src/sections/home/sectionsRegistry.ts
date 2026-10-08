/**
 * Webkorps Landing Page Section Registry
 * Maintains the exact visual order and implementation status of all landing page sections.
 * Status states: 'NOT STARTED' | 'IN PROGRESS' | 'REVIEW' | 'APPROVED' | 'LOCKED'
 */

import type { SectionDescriptor } from '../../types';

export const SECTIONS_REGISTRY: SectionDescriptor[] = [
  {
    id: 'header',
    order: 1,
    name: '01 — Header / Navigation',
    status: 'REVIEW',
    notes: 'Navigation bar with logo, links (About, Case Studies, Careers, Contact Us), search, Start the Conversation CTA'
  },
  {
    id: 'hero',
    order: 2,
    name: '02 — Hero',
    status: 'REVIEW',
    notes: 'Headline: Building Digital Products That Drive Real Impact. CTAs: Watch how it works, Start a Project. Quick service cards'
  },
  {
    id: 'leading-brands',
    order: 3,
    name: '03 — Leading Brands',
    status: 'REVIEW',
    notes: 'Title: Leading Brands That Trust Our IT Solutions & Services. Logo strip: Verizon, Acima, Bhai Bandhu, Cryoport, Puravankara, Property Finder, Cloudshot'
  },
  {
    id: 'stats',
    order: 4,
    name: '04 — Statistics / Numbers',
    status: 'REVIEW',
    notes: 'Title: Every Number Holds a Story. Metrics: 08 Years in Business, 150 Clients Served, 180 Projects Delivered (Discrepancy flagged)'
  },
  {
    id: 'ai-innovation',
    order: 5,
    name: '05 — AI-Powered Innovation',
    status: 'REVIEW',
    notes: 'Title: AI-Powered Innovation for Your Business. 4 Cards: How We Use AI, How AI Helps Your Business, AI DLC Method, SaaS Smarter With AI'
  },
  {
    id: 'services',
    order: 6,
    name: '06 — Services / Technology',
    status: 'REVIEW',
    notes: 'Title: Smart Technology for Smarter Business Growth. 6 Cards: Mobile, Web, Custom Software, Blockchain, Enterprise, AI-ML'
  },
  {
    id: 'industries',
    order: 7,
    name: '07 — Industry Solutions',
    status: 'REVIEW',
    notes: 'Title: Industry-focused solutions for real business challenges. Carousel/Cards: Manufacturing, Logistics & Supply Chain, Education & E-Learning with 3D illustration hover reveals'
  },
  {
    id: 'integrations',
    order: 8,
    name: '08 — Integrations / Technology Ecosystem',
    status: 'REVIEW',
    notes: 'Title: Our Seamless Integrations to Enhance Your Digital Ecosystem. Interactive tabs: IoT, RPA, AI&ML, Cyber Security, Data Analytics, Block Chain'
  },
  {
    id: 'leadership',
    order: 9,
    name: '09 — Leadership',
    status: 'REVIEW',
    notes: 'Title: Meet the leaders building whats next. Chirag Agrawal (CEO & Founder), Amul Choudhary (COO & Co-Founder)'
  },
  {
    id: 'case-studies',
    order: 10,
    name: '10 — Case Studies',
    status: 'REVIEW',
    notes: 'Title: Industry-focused solutions for real business challenges. Flagship stories: Cigna, PayPal'
  },
  {
    id: 'partners',
    order: 11,
    name: '11 — Technology Partners / Trust',
    status: 'REVIEW',
    notes: 'Title: Trusted OEM Partners. Proven Technology. Cloud / Enterprise partners: Cisco, AWS, Salesforce, HPE Juniper, Trellix, Fortinet, CloudSEK, Sysdig, Adobe'
  },
  {
    id: 'banner-callout',
    order: 12,
    name: '12 — Need Technology Partner Callout',
    status: 'REVIEW',
    notes: 'Title: Need the Right Technology Partner? Build faster, innovate smarter, and scale confidently with Webkorps.'
  },
  {
    id: 'insights',
    order: 13,
    name: '13 — Insights / Blog',
    status: 'REVIEW',
    notes: 'Title: Explore Blogs, insights, and stories shaping the future. Articles on Industrial IoT, Power BI Consulting'
  },
  {
    id: 'faq',
    order: 14,
    name: '14 — FAQ',
    status: 'REVIEW',
    notes: 'Title: Frequently Asked Questions. Accordion (first open by default) + Book a Consultation CTA card'
  },
  {
    id: 'contact',
    order: 15,
    name: '15 — Contact / Consultation',
    status: 'REVIEW',
    notes: 'Title: Talk to Our Support Team. Two-column layout with 3D map/search visual and interactive lead generation form'
  },
  {
    id: 'footer',
    order: 16,
    name: '16 — Footer',
    status: 'REVIEW',
    notes: 'Pre-footer CTA, 5 columns (Company, Events, Services, Technology, Industry), 5 Global office locations, Copyright 2026'
  }
];
