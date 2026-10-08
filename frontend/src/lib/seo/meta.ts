/**
 * SEO Document Meta & Tag Manager
 */

import type { SEOMetadata } from '../../types';

export function updateSEOMetadata(metadata: SEOMetadata) {
  if (typeof document === 'undefined') return;

  // Title
  document.title = metadata.title;

  // Update or create meta tag helper
  const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
    let tag = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.content = content;
  };

  setMetaTag('name', 'description', metadata.description);
  setMetaTag('name', 'title', metadata.title);
  
  if (metadata.keywords && metadata.keywords.length > 0) {
    setMetaTag('name', 'keywords', metadata.keywords.join(', '));
  }

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = metadata.canonicalUrl;

  // Open Graph
  setMetaTag('property', 'og:title', metadata.title);
  setMetaTag('property', 'og:description', metadata.description);
  setMetaTag('property', 'og:url', metadata.canonicalUrl);
  setMetaTag('property', 'og:type', metadata.ogType || 'website');
  if (metadata.ogImage) {
    setMetaTag('property', 'og:image', metadata.ogImage);
  }

  // Twitter
  setMetaTag('name', 'twitter:card', metadata.twitterCard || 'summary_large_image');
  setMetaTag('name', 'twitter:title', metadata.title);
  setMetaTag('name', 'twitter:description', metadata.description);
  if (metadata.ogImage) {
    setMetaTag('name', 'twitter:image', metadata.ogImage);
  }
}
