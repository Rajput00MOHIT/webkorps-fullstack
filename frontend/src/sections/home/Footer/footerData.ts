/**
 * Webkorps Section 15 — Footer Data Architecture
 * Source of Truth: Figma Node 1207-2502
 */

export interface FooterNavLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface FooterNavGroup {
  title: string;
  links: FooterNavLink[];
}

export interface FooterOffice {
  id: string;
  name: string;
  addressLines: string[];
}

export interface FooterSocialLink {
  name: string;
  href: string;
  ariaLabel: string;
  icon: 'instagram' | 'linkedin' | 'facebook' | 'x';
}

export const FOOTER_NAV_GROUPS: FooterNavGroup[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#leadership' },
      { label: 'Careers', href: '#careers' },
    ],
  },
  {
    title: 'Events',
    links: [
      { label: 'CES', href: '#events' },
      { label: 'IndiaSoft', href: '#events' },
      { label: 'Inbound', href: '#events' },
      { label: 'Gitex Dubai', href: '#events' },
      { label: 'MWC', href: '#events' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Mobile Development', href: '#services' },
      { label: 'Web Development', href: '#services' },
      { label: 'Cloud Solutions', href: '#services' },
      { label: 'E-Commerce Development', href: '#services' },
      { label: 'AI&ML services', href: '#services' },
    ],
  },
  {
    title: 'Technology',
    links: [
      { label: 'RoR', href: '#integrations' },
      { label: 'JAVA', href: '#integrations' },
      { label: 'Android', href: '#integrations' },
      { label: 'Python', href: '#integrations' },
      { label: 'IOS', href: '#integrations' },
    ],
  },
  {
    title: 'Industry',
    links: [
      { label: 'Logistic Industry', href: '#industries' },
      { label: 'HealthCare', href: '#industries' },
      { label: 'FinTech', href: '#industries' },
      { label: 'Real Estate', href: '#industries' },
    ],
  },
];

export const FOOTER_OFFICES: FooterOffice[] = [
  {
    id: 'indore',
    name: 'Indore, India (HQ)',
    addressLines: [
      '4th Floor, Winway World',
      'Offices, Vijay Nagar, Indore,',
      'Madhya Pradesh 452010',
    ],
  },
  {
    id: 'pune',
    name: 'Pune, India',
    addressLines: [
      'Trios Co-working, 3rd floor,',
      'Lalwani Icon, off New Airport',
      'Road, Sakore Nagar, Viman',
      'Nagar, Pune, Maharashtra',
      '411014',
    ],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru, India',
    addressLines: [
      '7th Floor, Commerce Mantri,',
      '12, 1 & 2, Bannerghatta Road,',
      'BTM 2nd Stage, BTM Layout,',
      'Bengaluru, Karnataka 560076',
    ],
  },
  {
    id: 'frisco',
    name: 'Frisco, TX',
    addressLines: [
      '6160 Warren Parkway,',
      'Suite 100 Frisco, Texas',
      '75034',
    ],
  },
  {
    id: 'sheridan',
    name: 'Sheridan, WY',
    addressLines: [
      '1309 Coffeen Ave, STE',
      'B1, Sheridan, WY 82801',
    ],
  },
];

export const FOOTER_SOCIAL_LINKS: FooterSocialLink[] = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/webkorps',
    ariaLabel: 'Webkorps on Instagram',
    icon: 'instagram',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/webkorps',
    ariaLabel: 'Webkorps on LinkedIn',
    icon: 'linkedin',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/webkorps',
    ariaLabel: 'Webkorps on Facebook',
    icon: 'facebook',
  },
  {
    name: 'X',
    href: 'https://twitter.com/webkorps',
    ariaLabel: 'Webkorps on X',
    icon: 'x',
  },
];

export const FOOTER_LEGAL_LINKS: FooterNavLink[] = [
  { label: 'Privacy Policy', href: '#privacy-policy' },
  { label: 'Cookies', href: '#cookies' },
  { label: 'Legal Disclaimer', href: '#legal-disclaimer' },
  { label: 'Sitemap', href: '#sitemap' },
];
