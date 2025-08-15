/**
 * Cache Strategy Utilities
 * 
 * Reusable caching strategies and utilities for the ScienceHabits service worker
 * and client-side cache management.
 */

export interface CacheConfig {
  name: string;
  version: string;
  maxAge: number; // in milliseconds
  maxEntries: number;
  strategies: CacheStrategy[];
}

export interface CacheStrategy {
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  cacheName: string;
  maxAge?: number;
}

export interface CacheInfo {
  name: string;
  size: number;
  entryCount: number;
  lastModified: Date;
}

/**
 * Default cache configurations for ScienceHabits
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  appShell: {
    name: 'sciencehabits-shell',
    version: 'v1',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50,
    strategies: [
      {
        pattern: /\/(static\/js\/|static\/css\/|favicon\.ico|logo\d+\.png).*$/,
        strategy: 'cache-first',
        cacheName: 'sciencehabits-shell-v1'
      }
    ]
  },
  
  data: {
    name: 'sciencehabits-data',
    version: 'v1',
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 200,
    strategies: [
      {
        pattern: /\/api\/(habits|progress|analytics)/,
        strategy: 'network-first',
        cacheName: 'sciencehabits-data-v1'
      }
    ]
  },
  
  research: {
    name: 'sciencehabits-research',
    version: 'v1',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 500,
    strategies: [
      {
        pattern: /\/api\/research/,
        strategy: 'stale-while-revalidate',
        cacheName: 'sciencehabits-research-v1'
      }
    ]
  },
  
  translations: {
    name: 'sciencehabits-i18n',
    version: 'v1',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
    strategies: [
      {
        pattern: /\/api\/translations/,
        strategy: 'cache-first',
        cacheName: 'sciencehabits-i18n-v1'
      }
    ]
  },
  
  images: {
    name: 'sciencehabits-images',
    version: 'v1',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100,
    strategies: [
      {
        pattern: /\.(jpg|jpeg|png|gif|webp|svg)$/,
        strategy: 'cache-first',
        cacheName: 'sciencehabits-images-v1'
      }
    ]
  }
};

/**
 * Cache management utilities
 */
export class CacheManager {
  /**
   * Get information about all caches
   */
  static async getCacheInfo(): Promise<CacheInfo[]> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    const cacheNames = await caches.keys();
    const cacheInfos: CacheInfo[] = [];

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        // Estimate cache size (rough calculation)
        const estimatedSize = requests.length * 50000; // ~50KB per entry (rough estimate)
        
        cacheInfos.push({
          name: cacheName,
          size: estimatedSize,
          entryCount: requests.length,
          lastModified: new Date() // Would need to track this separately
        });
      } catch (error) {
        console.error(`[CacheManager] Failed to get info for cache ${cacheName}:`, error);
      }
    }

    return cacheInfos;
  }

  /**
   * Clear specific cache
   */
  static async clearCache(cacheName: string): Promise<boolean> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    try {
      const deleted = await caches.delete(cacheName);
      console.log(`[CacheManager] Cache ${cacheName} ${deleted ? 'deleted' : 'not found'}`);
      return deleted;
    } catch (error) {
      console.error(`[CacheManager] Failed to clear cache ${cacheName}:`, error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  static async clearAllCaches(): Promise<number> {
    if (!('caches' in window)) {
      throw new Error('Cache API not supported');
    }

    try {
      const cacheNames = await caches.keys();
      let clearedCount = 0;

      await Promise.all(
        cacheNames.map(async (cacheName) => {
          const deleted = await caches.delete(cacheName);
          if (deleted) clearedCount++;
        })
      );

      console.log(`[CacheManager] Cleared ${clearedCount} caches`);
      return clearedCount;
    } catch (error) {
      console.error('[CacheManager] Failed to clear all caches:', error);
      return 0;
    }
  }

  /**
   * Estimate total cache size
   */
  static async getTotalCacheSize(): Promise<number> {
    const cacheInfos = await this.getCacheInfo();
    return cacheInfos.reduce((total, info) => total + info.size, 0);
  }

  /**
   * Check if a URL is cached
   */
  static async isUrlCached(url: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(url);
        if (response) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[CacheManager] Failed to check if URL is cached:', error);
      return false;
    }
  }

  /**
   * Preload critical resources
   */
  static async preloadCriticalResources(urls: string[]): Promise<void> {
    if (!('caches' in window)) {
      console.warn('[CacheManager] Cache API not supported, skipping preload');
      return;
    }

    try {
      const cache = await caches.open(CACHE_CONFIGS.appShell.name + '-' + CACHE_CONFIGS.appShell.version);
      
      const promises = urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            console.log(`[CacheManager] Preloaded: ${url}`);
          }
        } catch (error) {
          console.warn(`[CacheManager] Failed to preload ${url}:`, error);
        }
      });

      await Promise.all(promises);
      console.log(`[CacheManager] Preloaded ${urls.length} critical resources`);
    } catch (error) {
      console.error('[CacheManager] Failed to preload critical resources:', error);
    }
  }

  /**
   * Update cache with fresh content
   */
  static async updateCache(cacheName: string, url: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cache = await caches.open(cacheName);
      const response = await fetch(url);
      
      if (response.ok) {
        await cache.put(url, response);
        console.log(`[CacheManager] Updated cache ${cacheName} with ${url}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`[CacheManager] Failed to update cache ${cacheName}:`, error);
      return false;
    }
  }

  /**
   * Cleanup old cache entries
   */
  static async cleanupOldEntries(cacheName: string, maxAge: number): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      const cutoffTime = Date.now() - maxAge;
      let deletedCount = 0;

      for (const request of requests) {
        try {
          const response = await cache.match(request);
          if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const responseTime = new Date(dateHeader).getTime();
              if (responseTime < cutoffTime) {
                await cache.delete(request);
                deletedCount++;
              }
            }
          }
        } catch (error) {
          console.warn('[CacheManager] Failed to check entry age:', error);
        }
      }

      console.log(`[CacheManager] Cleaned up ${deletedCount} old entries from ${cacheName}`);
      return deletedCount;
    } catch (error) {
      console.error(`[CacheManager] Failed to cleanup old entries in ${cacheName}:`, error);
      return 0;
    }
  }

  /**
   * Get cache usage statistics
   */
  static async getCacheStats(): Promise<{
    totalCaches: number;
    totalSize: number;
    totalEntries: number;
    cacheBreakdown: Record<string, { size: number; entries: number }>;
  }> {
    const cacheInfos = await this.getCacheInfo();
    
    const stats = {
      totalCaches: cacheInfos.length,
      totalSize: 0,
      totalEntries: 0,
      cacheBreakdown: {} as Record<string, { size: number; entries: number }>
    };

    for (const info of cacheInfos) {
      stats.totalSize += info.size;
      stats.totalEntries += info.entryCount;
      stats.cacheBreakdown[info.name] = {
        size: info.size,
        entries: info.entryCount
      };
    }

    return stats;
  }
}

/**
 * Service Worker communication helpers
 */
export class ServiceWorkerCacheManager {
  /**
   * Send cache command to service worker
   */
  static async sendCacheCommand(command: string, data?: any): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No service worker controller available');
    }

    navigator.serviceWorker.controller.postMessage({
      type: command,
      data
    });
  }

  /**
   * Clear cache via service worker
   */
  static async clearCacheViaServiceWorker(cacheName: string): Promise<void> {
    await this.sendCacheCommand('CLEAR_CACHE', { cacheName });
  }

  /**
   * Trigger cache update via service worker
   */
  static async updateCacheViaServiceWorker(cacheName: string, urls: string[]): Promise<void> {
    await this.sendCacheCommand('UPDATE_CACHE', { cacheName, urls });
  }

  /**
   * Get cache info via service worker
   */
  static async getCacheInfoViaServiceWorker(): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_INFO' },
          [messageChannel.port2]
        );
      } else {
        reject(new Error('No service worker controller available'));
      }
    });
  }
}

/**
 * Cache strategy implementations
 */
export class CacheStrategies {
  /**
   * Cache first strategy
   */
  static async cacheFirst(request: Request, cacheName: string): Promise<Response> {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Network request failed: ${errorMessage}`);
    }
  }

  /**
   * Network first strategy
   */
  static async networkFirst(request: Request, cacheName: string): Promise<Response> {
    const cache = await caches.open(cacheName);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  /**
   * Stale while revalidate strategy
   */
  static async staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    // Start fetch in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Background fetch failed:', errorMessage);
      return null;
    });

    // Return cached version immediately, or wait for network
    return cachedResponse || await fetchPromise || new Response('Network Error', { status: 503 });
  }
}

/**
 * Utility functions for common cache operations
 */

/**
 * Check if caching is supported
 */
export function isCacheSupported(): boolean {
  return 'caches' in window;
}

/**
 * Get cache name with version
 */
export function getCacheNameWithVersion(baseName: string, version: string): string {
  return `${baseName}-${version}`;
}

/**
 * Format cache size for display
 */
export function formatCacheSize(sizeInBytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Check if URL matches any cache strategy pattern
 */
export function getStrategyForUrl(url: string): CacheStrategy | null {
  for (const config of Object.values(CACHE_CONFIGS)) {
    for (const strategy of config.strategies) {
      if (strategy.pattern.test(url)) {
        return strategy;
      }
    }
  }
  return null;
}