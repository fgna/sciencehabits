/**
 * Health Service
 * 
 * Comprehensive health monitoring for the runtime API server.
 */

import { githubPagesProxy } from './githubPagesProxy';
import { config } from '../config';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    server: HealthCheck;
    githubPages: HealthCheck;
    memory: HealthCheck;
    cache: HealthCheck;
  };
  metrics: {
    requests: number;
    errors: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

class HealthService {
  private startTime: number;
  private lastGitHubPagesCheck: HealthCheck;
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;

  constructor() {
    this.startTime = Date.now();
    this.lastGitHubPagesCheck = {
      status: 'warn',
      message: 'Not yet checked',
      lastChecked: new Date().toISOString()
    };

    // Start periodic health checks
    this.startPeriodicChecks();
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicChecks(): void {
    // Check GitHub Pages health every 2 minutes
    setInterval(() => {
      this.checkGitHubPagesHealth();
    }, 2 * 60 * 1000);

    // Initial check
    setTimeout(() => {
      this.checkGitHubPagesHealth();
    }, 5000);
  }

  /**
   * Check GitHub Pages API health
   */
  private async checkGitHubPagesHealth(): Promise<void> {
    try {
      const result = await githubPagesProxy.healthCheck();
      
      this.lastGitHubPagesCheck = {
        status: result.healthy ? 'pass' : 'fail',
        responseTime: result.responseTime,
        message: result.error || 'OK',
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      this.lastGitHubPagesCheck = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check server health
   */
  private checkServerHealth(): HealthCheck {
    const uptime = Date.now() - this.startTime;
    
    // Consider server unhealthy if uptime is very low (< 30 seconds)
    // This might indicate restart loops
    if (uptime < 30000) {
      return {
        status: 'warn',
        message: 'Server recently started',
        lastChecked: new Date().toISOString()
      };
    }

    return {
      status: 'pass',
      message: 'Server running normally',
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Check memory health
   */
  private checkMemoryHealth(): HealthCheck {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Heap usage: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB (${heapUsagePercent.toFixed(1)}%)`;

    if (heapUsagePercent > 90) {
      status = 'fail';
      message += ' - Critical memory usage';
    } else if (heapUsagePercent > 75) {
      status = 'warn';
      message += ' - High memory usage';
    }

    return {
      status,
      message,
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Check cache health (placeholder - would integrate with actual cache)
   */
  private checkCacheHealth(): HealthCheck {
    // This would integrate with the actual cache service
    // For now, return a basic check
    return {
      status: 'pass',
      message: 'Cache operational',
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Record request metrics
   */
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
    
    if (isError) {
      this.errorCount++;
    }
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus(): HealthStatus {
    const checks = {
      server: this.checkServerHealth(),
      githubPages: this.lastGitHubPagesCheck,
      memory: this.checkMemoryHealth(),
      cache: this.checkCacheHealth()
    };

    // Determine overall status
    const statuses = Object.values(checks).map(check => check.status);
    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';

    if (statuses.includes('fail')) {
      overallStatus = 'down';
    } else if (statuses.includes('warn')) {
      overallStatus = 'degraded';
    }

    const uptime = Date.now() - this.startTime;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    const averageResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 1000), // in seconds
      version: config.deployment.version,
      environment: config.environment,
      checks,
      metrics: {
        requests: this.requestCount,
        errors: this.errorCount,
        errorRate: Math.round(errorRate * 10000) / 100, // percentage with 2 decimal places
        averageResponseTime: Math.round(averageResponseTime * 100) / 100 // ms with 2 decimal places
      }
    };
  }

  /**
   * Get simple health check for load balancers
   */
  getSimpleHealth(): { status: string; uptime: number } {
    const health = this.getHealthStatus();
    return {
      status: health.status,
      uptime: health.uptime
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
  }
}

export const healthService = new HealthService();