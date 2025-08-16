/**
 * GitHub Pages Proxy Service
 * 
 * Proxies requests to the GitHub Pages API with intelligent caching,
 * error handling, and performance optimization.
 */

import { config } from '../config';

export interface ProxyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  responseTime: number;
  cached: boolean;
}

class GitHubPagesProxy {
  private baseUrl: string;
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;

  constructor() {
    this.baseUrl = config.githubPagesUrl;
  }

  /**
   * Fetch content from GitHub Pages API
   */
  async fetchContent(
    type: string,
    language: string,
    filters: Record<string, any> = {}
  ): Promise<ProxyResponse> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const url = this.buildUrl(type, language, filters);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ScienceHabits-Runtime-API/1.0',
          'Cache-Control': 'no-cache'
        },
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      if (!response.ok) {
        this.errorCount++;
        return {
          success: false,
          error: `GitHub Pages API error: ${response.status} ${response.statusText}`,
          responseTime,
          cached: false
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
        responseTime,
        cached: false
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;
      this.errorCount++;

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: `GitHub Pages proxy error: ${errorMessage}`,
        responseTime,
        cached: false
      };
    }
  }

  /**
   * Build URL for GitHub Pages API request
   */
  private buildUrl(type: string, language: string, filters: Record<string, any>): string {
    let endpoint = '';
    
    switch (type) {
      case 'habits':
        endpoint = language === 'en' ? '/habits.json' : `/habits-${language}.json`;
        break;
      case 'research':
        endpoint = language === 'en' ? '/research.json' : `/research-${language}.json`;
        break;
      case 'goals':
        endpoint = language === 'en' ? '/goals.json' : `/goals-${language}.json`;
        break;
      case 'translations':
        endpoint = `/translations-${language}.json`;
        break;
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }

    const url = new URL(endpoint, this.baseUrl);
    
    // Add query parameters from filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // Add cache busting for development
    if (config.isDevelopment) {
      url.searchParams.append('_t', Date.now().toString());
    }

    return url.toString();
  }

  /**
   * Health check for GitHub Pages API
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/health.json`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ScienceHabits-Runtime-API/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          healthy: true,
          responseTime
        };
      } else {
        return {
          healthy: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get proxy statistics
   */
  getStats(): {
    requests: number;
    errors: number;
    errorRate: number;
    averageResponseTime: number;
    baseUrl: string;
  } {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
      baseUrl: this.baseUrl
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
  }
}

export const githubPagesProxy = new GitHubPagesProxy();