interface CachedResponse {
  response: string;
  timestamp: number;
  hitCount: number;
}

export class ResponseCache {
  private cache: Map<string, CachedResponse>;
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 100, ttlMs = 3600000) { // 1 hour default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.loadFromStorage();
  }

  get(userText: string): string | null {
    const key = this.normalize(userText);
    const cached = this.cache.get(key);

    if (!cached) {
      console.log('[ResponseCache] MISS:', key);
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttlMs) {
      console.log('[ResponseCache] EXPIRED:', key);
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Update hit count
    cached.hitCount++;
    this.cache.set(key, cached);
    this.saveToStorage();
    
    console.log('[ResponseCache] HIT:', key, 'hits:', cached.hitCount);
    return cached.response;
  }

  set(userText: string, response: string) {
    const key = this.normalize(userText);

    // Implement LRU eviction if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hitCount: 0
    });

    console.log('[ResponseCache] SET:', key);
    this.saveToStorage();
  }

  private normalize(text: string): string {
    // Normalize text for cache key
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:]/g, '')
      .replace(/\s+/g, ' ');
  }

  private evictLRU() {
    // Find entry with lowest hit count and oldest timestamp
    let lruKey: string | null = null;
    let lowestScore = Infinity;

    for (const [key, value] of this.cache.entries()) {
      const age = Date.now() - value.timestamp;
      const score = value.hitCount / (age / 1000); // Hits per second
      
      if (score < lowestScore) {
        lowestScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      console.log('[ResponseCache] EVICT:', lruKey);
      this.cache.delete(lruKey);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('deepseek_response_cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
        console.log('[ResponseCache] Loaded', this.cache.size, 'entries from storage');
      }
    } catch (error) {
      console.error('[ResponseCache] Error loading from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('deepseek_response_cache', JSON.stringify(data));
    } catch (error) {
      console.error('[ResponseCache] Error saving to storage:', error);
    }
  }

  clear() {
    this.cache.clear();
    localStorage.removeItem('deepseek_response_cache');
    console.log('[ResponseCache] Cleared');
  }

  getStats() {
    let totalHits = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const value of this.cache.values()) {
      totalHits += value.hitCount;
      oldestEntry = Math.min(oldestEntry, value.timestamp);
      newestEntry = Math.max(newestEntry, value.timestamp);
    }

    return {
      size: this.cache.size,
      totalHits,
      oldestAge: oldestEntry === Date.now() ? 0 : Date.now() - oldestEntry,
      newestAge: newestEntry === 0 ? 0 : Date.now() - newestEntry
    };
  }
}
