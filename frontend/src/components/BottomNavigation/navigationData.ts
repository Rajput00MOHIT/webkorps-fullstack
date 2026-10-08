export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  items: ServiceItem[];
}

export interface ImpactStats {
  title: string;
  highlight: string;
  description: string;
  stats: Array<{
    value: string;
    label: string;
  }>;
}

export interface IndustryItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface TechnologyItem {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
}

export interface InsightItem {
  id: string;
  title: string;
  category: string;
  readTime: string;
  href: string;
}

export interface CaseStudyNavItem {
  id: string;
  client: string;
  category: string;
  title: string;
  description: string;
  href: string;
}

export type ActiveMenuType = 'services' | 'industries' | 'case-studies' | 'technologies' | 'insights' | null;

export const SERVICES_DATA: ServiceCategory[] = [
  {
    id: 'web-mobile',
    name: 'WEB & MOBILE',
    items: [
      {
        id: 'web-dev',
        title: 'Web Development',
        description: 'Creating scalable, high-performance web solutions and custom portals.',
        href: '#services',
      },
      {
        id: 'custom-software',
        title: 'Custom Software Development',
        description: 'Custom software built to solve unique business challenges and goals.',
        href: '#services',
      },
      {
        id: 'ecommerce',
        title: 'E-Commerce Development',
        description: 'Empowering online stores with scalable high-converting solutions.',
        href: '#services',
      },
    ],
  },
  {
    id: 'enterprise-cloud',
    name: 'ENTERPRISE & CLOUD',
    items: [
      {
        id: 'enterprise-software',
        title: 'Enterprise Software Development',
        description: 'Driving business efficiency through robust enterprise-grade platforms.',
        href: '#services',
      },
      {
        id: 'cloud-app',
        title: 'Cloud Application Development',
        description: 'Scalable and secure cloud solutions built for resilient performance.',
        href: '#services',
      },
      {
        id: 'staff-aug',
        title: 'IT Staff Augmentation',
        description: 'Empower your projects with skilled IT professionals on demand.',
        href: '#contact',
      },
      {
        id: 'managed-it',
        title: 'Managed IT Services',
        description: 'Reliable IT management for seamless operations and infrastructure health.',
        href: '#contact',
      },
    ],
  },
  {
    id: 'emerging-tech',
    name: 'EMERGING TECH',
    items: [
      {
        id: 'ai-ml',
        title: 'AI-ML Development',
        description: 'Unlock business potential through AI and machine learning solutions.',
        href: '#ai-innovation',
      },
      {
        id: 'blockchain',
        title: 'Blockchain Development',
        description: 'Powering the future of industries with secure decentralized blockchain solutions.',
        href: '#services',
      },
      {
        id: 'iot',
        title: 'IoT Application Development',
        description: 'Elevate efficiency with custom IoT ecosystems and connected devices.',
        href: '#integrations',
      },
      {
        id: 'salesforce',
        title: 'Salesforce Development',
        description: 'Empowering businesses with customized CRM and Salesforce solutions.',
        href: '#contact',
      },
    ],
  },
];

export const IMPACT_DATA: ImpactStats = {
  title: 'OUR IMPACT',
  highlight: '10+ Years of Digital Excellence',
  description: 'Trusted by 350+ satisfied clients across 30+ countries worldwide.',
  stats: [
    {
      value: '500+',
      label: 'Products Delivered',
    },
    {
      value: '350+',
      label: 'Satisfied Clients',
    },
  ],
};

export const INDUSTRIES_NAV_DATA: IndustryItem[] = [
  {
    id: 'logistic',
    title: 'Logistic Industry',
    description: 'Driving Efficiency Through Smart Logistics Solutions',
    href: '#industries',
  },
  {
    id: 'real-estate',
    title: 'Real Estate',
    description: 'Transforming Real Estate with Smart Tech Solutions',
    href: '#industries',
  },
  {
    id: 'healthcare',
    title: 'HealthCare',
    description: 'Innovative Tech Solutions for Better Healthcare Outcomes',
    href: '#industries',
  },
  {
    id: 'retail',
    title: 'Retail',
    description: 'Empowering Retailers with Smart Technology',
    href: '#industries',
  },
  {
    id: 'fintech',
    title: 'FinTech',
    description: 'Secure and Scalable Fintech Solutions',
    href: '#industries',
  },
  {
    id: 'travel',
    title: 'Travel and Hospitality',
    description: 'Enhancing Experiences with Travel Tech Solutions',
    href: '#industries',
  },
  {
    id: 'warehouse',
    title: 'Warehouse',
    description: 'Optimizing Warehouse Operations with Smart Solutions',
    href: '#industries',
  },
];

export const TECHNOLOGIES_NAV_DATA: TechnologyItem[] = [
  {
    id: 'ai-ml-tech',
    category: 'INTELLIGENCE',
    title: 'AI & Machine Learning',
    description: 'Generative AI, neural models, NLP engines, and intelligent computer vision.',
    href: '#ai-innovation',
  },
  {
    id: 'cloud-devops',
    category: 'INFRASTRUCTURE',
    title: 'Cloud & DevOps Engineering',
    description: 'AWS, Azure, Google Cloud multi-region architectures with automated CI/CD.',
    href: '#integrations',
  },
  {
    id: 'iot-tech',
    category: 'CONNECTED SYSTEMS',
    title: 'Industrial IoT Systems',
    description: 'Sensor pipelines, edge computing, and real-time remote equipment monitoring.',
    href: '#integrations',
  },
  {
    id: 'cybersecurity',
    category: 'SECURITY & TRUST',
    title: 'Enterprise Cyber Security',
    description: 'Zero-trust architecture, threat surface analysis, and ISO 27001 compliance.',
    href: '#integrations',
  },
  {
    id: 'blockchain-tech',
    category: 'DECENTRALIZED',
    title: 'Blockchain & Smart Contracts',
    description: 'Enterprise ledger networks, cryptographic verification, and tokenized assets.',
    href: '#integrations',
  },
  {
    id: 'data-analytics',
    category: 'DATA INSIGHTS',
    title: 'Big Data & Power BI',
    description: 'Predictive intelligence dashboards, warehouse pipelines, and executive BI.',
    href: '#integrations',
  },
];

export const INSIGHTS_NAV_DATA: InsightItem[] = [
  {
    id: 'insight-1',
    category: 'INDUSTRIAL IOT',
    title: 'How Industrial IoT is Revolutionizing Modern Manufacturing Plants',
    readTime: '5 min read',
    href: '#insights',
  },
  {
    id: 'insight-2',
    category: 'ENTERPRISE AI',
    title: 'Building Resilient Generative AI Systems for Regulated Industries',
    readTime: '7 min read',
    href: '#insights',
  },
  {
    id: 'insight-3',
    category: 'DATA & ANALYTICS',
    title: 'Transforming Raw Enterprise Data into Real-Time Strategic Power BI Dashboards',
    readTime: '6 min read',
    href: '#insights',
  },
];

export interface InsightEventItem {
  id: string;
  badge: string;
  date: string;
  title: string;
  description: string;
  href: string;
}

export const INSIGHT_EVENTS_DATA: InsightEventItem[] = [
  {
    id: 'event-1',
    badge: 'WEBINAR',
    date: 'Oct 24, 2026',
    title: 'Architecting Enterprise AI Agents for Production Scale',
    description: 'Deep dive into LLM deployment, latency optimization, and enterprise security patterns.',
    href: '#insights',
  },
  {
    id: 'event-2',
    badge: 'GLOBAL SUMMIT',
    date: 'Nov 12, 2026',
    title: 'Cloud-Native & Distributed Systems World Summit',
    description: 'Keynotes and engineering sessions on modern multi-cloud resilience.',
    href: '#insights',
  },
  {
    id: 'event-3',
    badge: 'ROUNDTABLE',
    date: 'Dec 05, 2026',
    title: 'Industrial IoT & Predictive Telemetry Executive Forum',
    description: 'Strategies for zero unplanned downtime with edge computing and smart sensors.',
    href: '#insights',
  },
];

export const CASE_STUDIES_NAV_DATA: CaseStudyNavItem[] = [
  {
    id: 'cigna',
    client: 'Cigna Health',
    category: 'HEALTHCARE',
    title: 'Integrated Telehealth & Smart Patient Scheduling Portal',
    description: 'HIPAA-compliant web platform serving 4M+ members with real-time appointment sync.',
    href: '#case-studies',
  },
  {
    id: 'paypal',
    client: 'PayPal / Braintree',
    category: 'FINTECH',
    title: 'High-Throughput Global Payment Engine & Tokenization',
    description: 'Zero-latency fault-tolerant merchant processing architecture supporting 10K TPS.',
    href: '#case-studies',
  },
  {
    id: 'acima',
    client: 'Acima Credit',
    category: 'LENDING & E-COMMERCE',
    title: 'Omnichannel POS Lending Platform & Instant Credit Engine',
    description: 'Underwriting decision microservices reducing approval cycle to under 3 seconds.',
    href: '#case-studies',
  },
  {
    id: 'cryoport',
    client: 'Cryoport Systems',
    category: 'SUPPLY CHAIN & IOT',
    title: 'Global Biopharma Cold-Chain Telemetry & Condition Tracking',
    description: 'Sub-minute cellular IoT telemetry monitoring life-saving cellular therapies.',
    href: '#case-studies',
  },
];
