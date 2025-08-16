/**
 * Metrics Service
 * 
 * Lightweight metrics collection and reporting for performance monitoring.
 */

import { config } from '../config';

export interface RequestMetric {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  source: 'cache' | 'github_pages' | 'error' | 'validation_error' | 'not_found' | 'server_error';
  userAgent?: string;
  ip?: string;
}

export interface EventMetric {
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface MetricsSummary {
  uptime: number;
  requests: {
    total: number;
    perMinute: number;
    byStatus: Record<number, number>;
    bySource: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    slowestEndpoints: Array<{
      path: string;
      averageTime: number;
      requestCount: number;
    }>;
  };
  errors: {
    total: number;
    rate: number;
    recent: RequestMetric[];
  };
  cache: {
    hitRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
  };
  events: EventMetric[];
}

class MetricsService {
  private requests: RequestMetric[] = [];
  private events: EventMetric[] = [];
  private startTime: number;
  private maxStoredRequests = 1000;
  private maxStoredEvents = 100;

  constructor() {
    this.startTime = Date.now();
    
    // Cleanup old metrics every 10 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 10 * 60 * 1000);
  }

  /**
   * Record an API request
   */
  recordRequest(
    path: string,
    statusCode: number,
    source: RequestMetric['source'],
    responseTime?: number,
    method = 'GET',
    userAgent?: string,
    ip?: string
  ): void {
    const metric: RequestMetric = {
      path,
      method,
      statusCode,
      responseTime: responseTime || 0,
      timestamp: new Date().toISOString(),
      source,
      ...(userAgent && { userAgent }),
      ...(ip && { ip })
    };

    this.requests.push(metric);

    // Keep only the most recent requests
    if (this.requests.length > this.maxStoredRequests) {
      this.requests = this.requests.slice(-this.maxStoredRequests);
    }

    // Alert on high error rates if monitoring is enabled
    if (config.monitoring.enabled && statusCode >= 500) {
      this.checkErrorRate();
    }
  }

  /**
   * Record a custom event
   */
  recordEvent(event: string, data: Record<string, any>): void {
    const metric: EventMetric = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    this.events.push(metric);

    // Keep only the most recent events
    if (this.events.length > this.maxStoredEvents) {
      this.events = this.events.slice(-this.maxStoredEvents);
    }
  }

  /**
   * Get comprehensive metrics summary
   */
  getMetrics(): MetricsSummary {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime) / 1000);
    const oneMinuteAgo = new Date(now - 60000).toISOString();
    
    // Filter recent requests
    const recentRequests = this.requests.filter(r => r.timestamp > oneMinuteAgo);
    const errorRequests = this.requests.filter(r => r.statusCode >= 400);
    const recentErrors = errorRequests.filter(r => r.timestamp > oneMinuteAgo);

    // Calculate status code distribution
    const byStatus: Record<number, number> = {};
    this.requests.forEach(r => {
      byStatus[r.statusCode] = (byStatus[r.statusCode] || 0) + 1;
    });

    // Calculate source distribution
    const bySource: Record<string, number> = {};
    this.requests.forEach(r => {
      bySource[r.source] = (bySource[r.source] || 0) + 1;
    });

    // Calculate response times
    const responseTimes = this.requests
      .filter(r => r.responseTime > 0)
      .map(r => r.responseTime)
      .sort((a, b) => a - b);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p95ResponseTime = responseTimes.length > 0 ? responseTimes[p95Index] || 0 : 0;

    // Calculate slowest endpoints
    const endpointTimes: Record<string, { total: number; count: number }> = {};
    this.requests.forEach(r => {
      if (r.responseTime > 0) {
        if (!endpointTimes[r.path]) {
          endpointTimes[r.path] = { total: 0, count: 0 };
        }
        endpointTimes[r.path]!.total += r.responseTime;
        endpointTimes[r.path]!.count += 1;
      }
    });

    const slowestEndpoints = Object.entries(endpointTimes)
      .map(([path, stats]) => ({
        path,
        averageTime: stats.total / stats.count,
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // Calculate cache metrics
    const cacheHits = bySource.cache || 0;
    const totalRequests = this.requests.length;
    const cacheMisses = totalRequests - cacheHits;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    return {
      uptime,
      requests: {
        total: this.requests.length,
        perMinute: recentRequests.length,
        byStatus,
        bySource
      },
      performance: {
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
        slowestEndpoints
      },
      errors: {
        total: errorRequests.length,
        rate: totalRequests > 0 ? errorRequests.length / totalRequests : 0,
        recent: recentErrors.slice(-10) // Last 10 errors
      },
      cache: {
        hitRate: Math.round(hitRate * 10000) / 100, // percentage with 2 decimal places
        totalRequests,
        hits: cacheHits,
        misses: cacheMisses
      },
      events: this.events.slice(-20) // Last 20 events
    };
  }

  /**
   * Get metrics in Prometheus format (for monitoring systems)
   */
  getPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Server uptime
    lines.push(`# HELP sciencehabits_uptime_seconds Server uptime in seconds`);
    lines.push(`# TYPE sciencehabits_uptime_seconds counter`);
    lines.push(`sciencehabits_uptime_seconds ${metrics.uptime}`);

    // Request metrics
    lines.push(`# HELP sciencehabits_requests_total Total number of requests`);
    lines.push(`# TYPE sciencehabits_requests_total counter`);
    lines.push(`sciencehabits_requests_total ${metrics.requests.total}`);

    // Request rate
    lines.push(`# HELP sciencehabits_requests_per_minute Requests per minute`);
    lines.push(`# TYPE sciencehabits_requests_per_minute gauge`);
    lines.push(`sciencehabits_requests_per_minute ${metrics.requests.perMinute}`);

    // Error rate
    lines.push(`# HELP sciencehabits_error_rate Error rate (0-1)`);
    lines.push(`# TYPE sciencehabits_error_rate gauge`);
    lines.push(`sciencehabits_error_rate ${metrics.errors.rate}`);

    // Response time
    lines.push(`# HELP sciencehabits_response_time_seconds Average response time`);
    lines.push(`# TYPE sciencehabits_response_time_seconds gauge`);
    lines.push(`sciencehabits_response_time_seconds ${metrics.performance.averageResponseTime / 1000}`);

    // Cache hit rate
    lines.push(`# HELP sciencehabits_cache_hit_rate Cache hit rate (0-100)`);
    lines.push(`# TYPE sciencehabits_cache_hit_rate gauge`);
    lines.push(`sciencehabits_cache_hit_rate ${metrics.cache.hitRate}`);

    // Status code distribution
    Object.entries(metrics.requests.byStatus).forEach(([code, count]) => {
      lines.push(`sciencehabits_requests_by_status{status="${code}"} ${count}`);
    });

    return lines.join('\n') + '\n';
  }

  /**
   * Check error rate and trigger alerts if necessary
   */
  private checkErrorRate(): void {
    if (!config.monitoring.enabled) return;

    const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Last 5 minutes
    const recentRequests = this.requests.filter(r => r.timestamp > recentTime);
    const recentErrors = recentRequests.filter(r => r.statusCode >= 500);

    if (recentRequests.length >= 10) { // Only check if we have enough data
      const errorRate = recentErrors.length / recentRequests.length;
      
      if (errorRate > config.monitoring.alertThresholds.errorRate) {
        this.triggerAlert('high_error_rate', {
          errorRate: Math.round(errorRate * 10000) / 100,
          threshold: config.monitoring.alertThresholds.errorRate * 100,
          recentErrors: recentErrors.length,
          recentRequests: recentRequests.length
        });
      }
    }
  }

  /**
   * Trigger monitoring alert
   */
  private triggerAlert(type: string, data: Record<string, any>): void {
    this.recordEvent('alert_triggered', { type, ...data });

    // In a real implementation, this would send alerts to external services
    console.warn(`🚨 Alert triggered: ${type}`, data);

    if (config.monitoring.webhookUrl) {
      // Send webhook notification
      fetch(config.monitoring.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: type,
          data,
          timestamp: new Date().toISOString(),
          server: {
            environment: config.environment,
            version: config.deployment.version
          }
        })
      }).catch(error => {
        console.error('Failed to send alert webhook:', error);
      });
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Keep only requests from the last hour
    const initialRequestCount = this.requests.length;
    this.requests = this.requests.filter(r => r.timestamp > oneHourAgo);
    
    // Keep only events from the last hour
    const initialEventCount = this.events.length;
    this.events = this.events.filter(e => e.timestamp > oneHourAgo);

    const removedRequests = initialRequestCount - this.requests.length;
    const removedEvents = initialEventCount - this.events.length;

    if (removedRequests > 0 || removedEvents > 0) {
      console.log(`🧹 Cleaned up ${removedRequests} old request metrics and ${removedEvents} old events`);
    }
  }

  /**
   * Export metrics data for backup or analysis
   */
  exportMetrics(): {
    requests: RequestMetric[];
    events: EventMetric[];
    summary: MetricsSummary;
    exportTime: string;
  } {
    return {
      requests: [...this.requests],
      events: [...this.events],
      summary: this.getMetrics(),
      exportTime: new Date().toISOString()
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.requests = [];
    this.events = [];
    this.startTime = Date.now();
    console.log('📊 All metrics have been reset');
  }
}

export const metricsService = new MetricsService();