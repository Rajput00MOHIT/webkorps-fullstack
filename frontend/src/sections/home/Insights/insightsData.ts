import imgBlog1 from '../../../assets/Blog/image 368.png';
import imgBlog2 from '../../../assets/Blog/image 369.png';

export interface BlogPost {
  id: string;
  date: string;
  displayDate: string;
  category: string;
  title: string;
  image: string | any;
  imageAlt: string;
  href: string;
}

/**
 * Approved Blog Posts from Figma Design (Node 942-1926 / Section 12)
 *
 * Source of truth:
 * - BLOG 01: August 19, 2026 | AI-ML Development | Industrial IoT Pilots Are Failing. Here Is Where
 * - BLOG 02: June 23, 2026 | Technology | Power BI Consulting for Digital Transformation
 *
 * For desktop carousel navigation demonstration (2 cards visible simultaneously),
 * the approved articles populate the interactive slider track.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-industrial-iot',
    date: '2026-08-19',
    displayDate: 'August 19, 2026',
    category: 'AI-ML Development',
    title: 'Industrial IoT Pilots Are Failing. Here Is Where',
    image: imgBlog1,
    imageAlt: 'Laptop interface showing industrial IoT network diagnostic dashboard',
    href: '#insights',
  },
  {
    id: 'blog-power-bi-consulting',
    date: '2026-06-23',
    displayDate: 'June 23, 2026',
    category: 'Technology',
    title: 'Power BI Consulting for Digital Transformation',
    image: imgBlog2,
    imageAlt: 'Laptop display showing real-time Power BI revenue and business intelligence dashboard',
    href: '#insights',
  },
  {
    id: 'blog-industrial-iot-2',
    date: '2026-08-19',
    displayDate: 'August 19, 2026',
    category: 'AI-ML Development',
    title: 'Industrial IoT Pilots Are Failing. Here Is Where',
    image: imgBlog1,
    imageAlt: 'Laptop interface showing industrial IoT network diagnostic dashboard',
    href: '#insights',
  },
  {
    id: 'blog-power-bi-consulting-2',
    date: '2026-06-23',
    displayDate: 'June 23, 2026',
    category: 'Technology',
    title: 'Power BI Consulting for Digital Transformation',
    image: imgBlog2,
    imageAlt: 'Laptop display showing real-time Power BI revenue and business intelligence dashboard',
    href: '#insights',
  },
];
