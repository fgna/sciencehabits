/**
 * Hybrid Content Service
 * 
 * Enhanced content service that supports multiple API backends with
 * intelligent fallback strategies and seamless migration capabilities.
 */

import { migrationConfig, MigrationConfig } from './MigrationConfig';
// MVP: ContentAPIClient removed for MVP - using stub
// import { ContentAPIClient } from '../admin/ContentAPIClient';

// MVP: Stub class for ContentAPIClient
class ContentAPIClient {
  constructor(public baseUrl: string) {}
  async checkHealth(): Promise<void> { throw new Error('MVP: Admin features disabled'); }
  async testConnection(): Promise<{ connected: boolean }> { return { connected: false }; }
  async fetchHabits(): Promise<any[]> { return []; }
  async fetchResearch(): Promise<any[]> { return []; }
  async fetchGoals(): Promise<any[]> { return []; }
  async fetchTranslations(): Promise<any[]> { return []; }
  async getHabits(language: string): Promise<any[]> { return []; }
  async getResearch(language: string): Promise<any[]> { return []; }
  async getGoals(language: string): Promise<any[]> { return []; }
  async getTranslations(language: string): Promise<any[]> { return []; }
}

export interface ContentRequest {
  type: 'habits' | 'research' | 'goals' | 'translations';
  language?: string;
  filters?: Record<string, any>;
  cacheStrategy?: 'cache_first' | 'network_first' | 'cache_only' | 'network_only';
  timeout?: number;
}

export interface ContentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'github_pages' | 'hybrid_runtime' | 'cache' | 'fallback';
  responseTime: number;
  cached: boolean;
  metadata: {
    version: string;
    timestamp: string;
    apiEndpoint: string;
  };
}

export interface APIEndpoint {
  name: string;
  url: string;
  priority: number;
  enabled: boolean;
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastHealthCheck: string;
  responseTime: number;
  errorRate: number;
}

export class HybridContentService {
  private config: MigrationConfig;
  private apiClients: Map<string, ContentAPIClient> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private healthStatus: Map<string, APIEndpoint> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half_open' }> = new Map();
  
  // Performance tracking
  private metrics = {
    requests: 0,
    successes: 0,
    failures: 0,
    cacheHits: 0,
    cacheMisses: 0,
    fallbacks: 0,
    totalResponseTime: 0
  };

  constructor() {
    this.config = migrationConfig.getConfig();
    
    // Subscribe to configuration changes
    migrationConfig.subscribe((newConfig) => {
      this.config = newConfig;
      this.updateAPIClients();
    });
    
    this.initializeAPIClients();
    this.startHealthChecking();
  }

  /**
   * Initialize API clients for all configured endpoints
   */
  private initializeAPIClients(): void {
    const apis = this.config.apis;
    
    Object.entries(apis).forEach(([name, api]) => {
      if (api.enabled && api.baseUrl) {
        const client = new ContentAPIClient(api.baseUrl);
        this.apiClients.set(name, client);
        
        // Initialize health status
        this.healthStatus.set(name, {
          name,
          url: api.baseUrl,
          priority: api.fallbackPriority,
          enabled: api.enabled,
          healthStatus: 'unknown',
          lastHealthCheck: new Date().toISOString(),
          responseTime: 0,
          errorRate: 0
        });
        
        // Initialize circuit breaker
        this.circuitBreakers.set(name, {
          failures: 0,
          lastFailure: 0,
          state: 'closed'
        });
      }
    });
    
    console.log(`🔧 Initialized ${this.apiClients.size} API clients`);
  }

  /**
   * Update API clients when configuration changes
   */
  private updateAPIClients(): void {
    // Remove disabled clients
    this.apiClients.forEach((client, name) => {
      const api = this.config.apis[name as keyof typeof this.config.apis];
      if (!api || !api.enabled) {
        this.apiClients.delete(name);
        this.healthStatus.delete(name);
        this.circuitBreakers.delete(name);
      }
    });
    
    // Add new clients
    Object.entries(this.config.apis).forEach(([name, api]) => {
      if (api.enabled && api.baseUrl && !this.apiClients.has(name)) {
        const client = new ContentAPIClient(api.baseUrl);
        this.apiClients.set(name, client);
        
        this.healthStatus.set(name, {
          name,
          url: api.baseUrl,
          priority: api.fallbackPriority,
          enabled: api.enabled,
          healthStatus: 'unknown',
          lastHealthCheck: new Date().toISOString(),
          responseTime: 0,
          errorRate: 0
        });
        
        this.circuitBreakers.set(name, {
          failures: 0,
          lastFailure: 0,
          state: 'closed'
        });
      }
    });
  }

  /**
   * Start periodic health checking of all API endpoints
   */
  private startHealthChecking(): void {
    const checkHealth = async () => {
      for (const [name, client] of this.apiClients) {
        await this.checkEndpointHealth(name, client);
      }
    };
    
    // Initial health check
    checkHealth();
    
    // Periodic health checks every 30 seconds
    setInterval(checkHealth, 30000);
  }

  /**
   * Check health of a specific API endpoint
   */
  private async checkEndpointHealth(name: string, client: ContentAPIClient): Promise<void> {
    const startTime = Date.now();
    const status = this.healthStatus.get(name);
    
    if (!status) return;
    
    try {
      const result = await client.testConnection();
      const responseTime = Date.now() - startTime;
      
      status.healthStatus = result.connected ? 'healthy' : 'down';
      status.responseTime = responseTime;
      status.lastHealthCheck = new Date().toISOString();
      
      // Reset circuit breaker on successful health check
      const breaker = this.circuitBreakers.get(name);
      if (breaker && result.connected) {
        breaker.failures = 0;
        breaker.state = 'closed';
      }
      
    } catch (error) {
      status.healthStatus = 'down';
      status.lastHealthCheck = new Date().toISOString();
      
      // Update circuit breaker
      const breaker = this.circuitBreakers.get(name);
      if (breaker) {
        breaker.failures++;
        breaker.lastFailure = Date.now();
        
        if (breaker.failures >= 5) {
          breaker.state = 'open';
        }
      }
    }
    
    this.healthStatus.set(name, status);
  }

  /**
   * Get available API endpoints sorted by priority and health
   */
  private getAvailableEndpoints(): APIEndpoint[] {
    return Array.from(this.healthStatus.values())
      .filter(endpoint => {
        const breaker = this.circuitBreakers.get(endpoint.name);
        return endpoint.enabled && 
               endpoint.healthStatus !== 'down' && 
               (!breaker || breaker.state !== 'open');
      })
      .sort((a, b) => {
        // Sort by health status first, then by priority
        const healthOrder: Record<string, number> = { healthy: 0, degraded: 1, unknown: 2, down: 3 };
        const healthDiff = (healthOrder[a.healthStatus] || 3) - (healthOrder[b.healthStatus] || 3);
        
        if (healthDiff !== 0) return healthDiff;
        return a.priority - b.priority;
      });
  }

  /**
   * Make a content request with fallback support
   */
  public async request<T = any>(req: ContentRequest): Promise<ContentResponse<T>> {
    const startTime = Date.now();
    this.metrics.requests++;
    
    // Check cache first if cache strategy allows
    if (req.cacheStrategy === 'cache_first' || req.cacheStrategy === 'cache_only') {
      const cached = this.getCachedData(req);
      if (cached) {
        this.metrics.cacheHits++;
        return {
          success: true,
          data: cached,
          source: 'cache',
          responseTime: Date.now() - startTime,
          cached: true,
          metadata: {
            version: this.config.version,
            timestamp: new Date().toISOString(),
            apiEndpoint: 'cache'
          }
        };
      }
      
      this.metrics.cacheMisses++;
      
      if (req.cacheStrategy === 'cache_only') {
        return {
          success: false,
          error: 'No cached data available',
          source: 'cache',
          responseTime: Date.now() - startTime,
          cached: false,
          metadata: {
            version: this.config.version,
            timestamp: new Date().toISOString(),
            apiEndpoint: 'cache'
          }
        };
      }
    }
    
    // Get available endpoints
    const endpoints = this.getAvailableEndpoints();
    
    if (endpoints.length === 0) {
      this.metrics.failures++;
      return {
        success: false,
        error: 'No available API endpoints',
        source: 'fallback',
        responseTime: Date.now() - startTime,
        cached: false,
        metadata: {
          version: this.config.version,
          timestamp: new Date().toISOString(),
          apiEndpoint: 'none'
        }
      };
    }
    
    // Try each endpoint in order
    let lastError = '';
    
    for (const endpoint of endpoints) {
      try {
        const client = this.apiClients.get(endpoint.name);
        if (!client) continue;
        
        const result = await this.makeAPIRequest(client, req, endpoint);
        
        if (result.success) {
          this.metrics.successes++;
          
          // Cache the result if successful
          this.setCachedData(req, result.data);
          
          return {
            ...result,
            source: endpoint.name as any,
            responseTime: Date.now() - startTime,
            cached: false,
            metadata: {
              version: this.config.version,
              timestamp: new Date().toISOString(),
              apiEndpoint: endpoint.url
            }
          };
        }
        
        lastError = result.error || 'Unknown error';
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // Update circuit breaker
        const breaker = this.circuitBreakers.get(endpoint.name);
        if (breaker) {
          breaker.failures++;
          breaker.lastFailure = Date.now();
          
          if (breaker.failures >= 3) {
            breaker.state = 'open';
          }
        }
      }
    }
    
    // All endpoints failed, try cache as last resort
    const cached = this.getCachedData(req);
    if (cached) {
      this.metrics.fallbacks++;
      return {
        success: true,
        data: cached,
        source: 'fallback',
        responseTime: Date.now() - startTime,
        cached: true,
        metadata: {
          version: this.config.version,
          timestamp: new Date().toISOString(),
          apiEndpoint: 'cache_fallback'
        }
      };
    }
    
    this.metrics.failures++;
    return {
      success: false,
      error: lastError || 'All API endpoints failed',
      source: 'fallback',
      responseTime: Date.now() - startTime,
      cached: false,
      metadata: {
        version: this.config.version,
        timestamp: new Date().toISOString(),
        apiEndpoint: 'none'
      }
    };
  }

  /**
   * Make an API request to a specific client
   */
  private async makeAPIRequest(
    client: ContentAPIClient, 
    req: ContentRequest, 
    endpoint: APIEndpoint
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    
    const timeout = req.timeout || 5000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
    
    const requestPromise = (async () => {
      switch (req.type) {
        case 'habits':
          return await client.getHabits(req.language || 'en');
        case 'research':
          return await client.getResearch(req.language || 'en');
        case 'goals':
          // Goals endpoint would be implemented in ContentAPIClient
          throw new Error('Goals endpoint not yet implemented');
        case 'translations':
          // Translations endpoint would be implemented in ContentAPIClient
          throw new Error('Translations endpoint not yet implemented');
        default:
          throw new Error(`Unknown request type: ${req.type}`);
      }
    })();
    
    try {
      const result = await Promise.race([requestPromise, timeoutPromise]);
      return result as { success: boolean; data?: any; error?: string };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate cache key for a request
   */
  private getCacheKey(req: ContentRequest): string {
    const key = `${req.type}_${req.language || 'en'}_${JSON.stringify(req.filters || {})}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get cached data for a request
   */
  private getCachedData(req: ContentRequest): any | null {
    const key = this.getCacheKey(req);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cached data for a request
   */
  private setCachedData(req: ContentRequest, data: any): void {
    const key = this.getCacheKey(req);
    const ttl = this.getCacheTTL(req.type);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Get cache TTL for different content types
   */
  private getCacheTTL(type: string): number {
    const ttls = {
      habits: 10 * 60 * 1000,      // 10 minutes
      research: 30 * 60 * 1000,    // 30 minutes
      goals: 60 * 60 * 1000,       // 1 hour
      translations: 5 * 60 * 1000   // 5 minutes
    };
    
    return ttls[type as keyof typeof ttls] || 10 * 60 * 1000;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxCacheSize = 100;
    
    // Remove expired entries
    for (const [key, cached] of this.cache) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
    
    // If cache is still too large, remove oldest entries
    if (this.cache.size > maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get service health status
   */
  public getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'down';
    endpoints: APIEndpoint[];
    metrics: {
      requests: number;
      successes: number;
      failures: number;
      cacheHits: number;
      cacheMisses: number;
      fallbacks: number;
      totalResponseTime: number;
    };
    cache: { size: number; hitRate: number };
  } {
    const endpoints = Array.from(this.healthStatus.values());
    const healthyCount = endpoints.filter(e => e.healthStatus === 'healthy').length;
    
    let overall: 'healthy' | 'degraded' | 'down' = 'down';
    if (healthyCount === endpoints.length) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    }
    
    const hitRate = this.metrics.requests > 0 
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      : 0;
    
    return {
      overall,
      endpoints,
      metrics: { ...this.metrics },
      cache: {
        size: this.cache.size,
        hitRate: Math.round(hitRate * 100) / 100
      }
    };
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Hybrid content service cache cleared');
  }

  /**
   * Force refresh of all endpoint health status
   */
  public async refreshHealth(): Promise<void> {
    const promises = Array.from(this.apiClients.entries()).map(([name, client]) =>
      this.checkEndpointHealth(name, client)
    );
    
    await Promise.allSettled(promises);
    console.log('🔄 Hybrid content service health refreshed');
  }

  /**
   * Convenience methods for specific content types
   */
  public async getHabits(language = 'en', options: Partial<ContentRequest> = {}): Promise<ContentResponse> {
    return this.request({
      type: 'habits',
      language,
      cacheStrategy: 'cache_first',
      ...options
    });
  }

  public async getResearch(language = 'en', options: Partial<ContentRequest> = {}): Promise<ContentResponse> {
    return this.request({
      type: 'research',
      language,
      cacheStrategy: 'cache_first',
      ...options
    });
  }

  public async getGoals(language = 'en', options: Partial<ContentRequest> = {}): Promise<ContentResponse> {
    return this.request({
      type: 'goals',
      language,
      cacheStrategy: 'cache_first',
      ...options
    });
  }
}

// Global hybrid content service instance
export const hybridContentService = new HybridContentService();