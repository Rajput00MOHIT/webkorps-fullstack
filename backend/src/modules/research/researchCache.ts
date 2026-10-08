export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class ResearchCache {
  private static store = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

  public static get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public static set<T>(key: string, value: T, ttlMs: number = this.DEFAULT_TTL_MS): void {
    // Keep max 500 entries in memory
    if (this.store.size > 500) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  public static clear(): void {
    this.store.clear();
  }
}
