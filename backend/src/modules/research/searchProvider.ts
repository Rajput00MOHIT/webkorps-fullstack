export interface SearchRequest {
  query: string;
  limit?: number;
  language?: string;
  region?: string;
  safeSearch?: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  rank?: number;
  sourceProvider: string;
}

export interface SearchResponse {
  provider: string;
  query: string;
  results: SearchResult[];
  fetchedAt: Date;
}

export interface SearchProvider {
  name: string;
  search(input: SearchRequest): Promise<SearchResponse>;
  isAvailable(): Promise<boolean>;
}

export class SearchProviderUnavailableError extends Error {
  public code = 'SEARCH_PROVIDER_UNAVAILABLE';
  constructor(message: string = 'Configured search provider is unavailable or returned an error.') {
    super(message);
    this.name = 'SearchProviderUnavailableError';
  }
}

import { SearXNGSearchProvider } from './searxngProvider.js';
import { DuckDuckGoSearchProvider } from './duckduckgoProvider.js';

export class SearchProviderFactory {
  public static getProvider(name?: string): SearchProvider {
    const configured = (name || process.env.SEARCH_PROVIDER || 'duckduckgo').toLowerCase().trim();

    if (configured === 'searxng') {
      return new SearXNGSearchProvider();
    }
    if (configured === 'duckduckgo') {
      return new DuckDuckGoSearchProvider();
    }

    // Default fallback
    return new DuckDuckGoSearchProvider();
  }
}
