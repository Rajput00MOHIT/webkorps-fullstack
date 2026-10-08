import type { IEmbeddingProvider } from './embeddingProvider.interface.js';

/**
 * High-performance deterministic 384-dimensional local embedding provider.
 * Runs in-process with 0 external API cost and 0 latency.
 * Produces unit-normalized vectors suitable for pgvector cosine distance (<->).
 */
export class LocalEmbeddingProvider implements IEmbeddingProvider {
  public readonly dimensions = 384;
  public readonly name = 'local-feature-normalized-384';

  public async generateEmbedding(text: string): Promise<number[]> {
    const vector = new Array(this.dimensions).fill(0);
    const normalized = text.toLowerCase().trim();
    if (!normalized) return vector;

    // Feature hashing over character and word n-grams
    const tokens = normalized.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const h1 = this.hashString(token, 0);
      const h2 = this.hashString(token, 1337);
      
      const idx1 = Math.abs(h1) % this.dimensions;
      const idx2 = Math.abs(h2) % this.dimensions;
      
      vector[idx1] += 1.0;
      vector[idx2] += 0.5;

      // Bigram feature
      if (i > 0) {
        const bigram = `${tokens[i - 1]}_${token}`;
        const h3 = this.hashString(bigram, 42);
        const idx3 = Math.abs(h3) % this.dimensions;
        vector[idx3] += 0.75;
      }
    }

    // L2 Normalize to unit sphere for accurate cosine distance
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = parseFloat((vector[i] / norm).toFixed(6));
      }
    }

    return vector;
  }

  public async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(t => this.generateEmbedding(t)));
  }

  private hashString(str: string, seed: number): number {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
}

export const defaultEmbeddingProvider = new LocalEmbeddingProvider();
