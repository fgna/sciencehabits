/**
 * Performance Monitor
 * 
 * Comprehensive performance tracking and optimization tooling for
 * measuring application performance, API response times, and user experience metrics.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'api' | 'render' | 'interaction' | 'navigation' | 'resource';
  metadata?: Record<string, any>;
}

interface PerformanceThreshold {
  warning: number;
  critical: number;
  unit: 'ms' | 'mb' | 'score' | 'count';
}

interface PerformanceReport {
  summary: {
    totalMetrics: number;
    timeRange: { start: string; end: string };
    overallHealth: 'good' | 'warning' | 'critical';
  };
  apiMetrics: {
    averageResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number; count: number }>;
    errorRate: number;
    totalRequests: number;
  };
  renderMetrics: {
    averageRenderTime: number;
    slowestComponents: Array<{ component: string; averageTime: number; count: number }>;
    totalRenders: number;
  };
  userExperience: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  };
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxStoredMetrics = 1000;
  private isEnabled = true;
  private observers: PerformanceObserver[] = [];
  
  // Performance thresholds (targets for optimization)
  private thresholds: Record<string, PerformanceThreshold> = {
    apiResponseTime: { warning: 500, critical: 1000, unit: 'ms' },
    renderTime: { warning: 16, critical: 50, unit: 'ms' }, // 60fps = 16ms budget
    memoryUsage: { warning: 50, critical: 100, unit: 'mb' },
    bundleSize: { warning: 1000, critical: 2000, unit: 'mb' },
    errorRate: { warning: 1, critical: 5, unit: 'score' }, // percentage
    loadTime: { warning: 2000, critical: 3000, unit: 'ms' }
  };

  constructor() {
    this.initializeWebVitals();
    this.setupPerformanceObservers();
    this.startPeriodicCleanup();
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    try {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric({
          name: 'largest_contentful_paint',
          value: lastEntry.startTime,
          category: 'navigation',
          metadata: { element: (lastEntry as any).element?.tagName }
        });
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: 'first_input_delay',
            value: entry.processingStart - entry.startTime,
            category: 'interaction',
            metadata: { eventType: entry.name }
          });
        });
      }).observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        this.recordMetric({
          name: 'cumulative_layout_shift',
          value: clsValue,
          category: 'render',
          metadata: { sessionId: this.generateSessionId() }
        });
      }).observe({ type: 'layout-shift', buffered: true });

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  /**
   * Setup performance observers for various metrics
   */
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Navigation timing
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: 'navigation_timing',
            value: entry.loadEventEnd - entry.fetchStart,
            category: 'navigation',
            metadata: {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
              firstByte: entry.responseStart - entry.fetchStart,
              domComplete: entry.domComplete - entry.fetchStart
            }
          });
        });
      }).observe({ type: 'navigation', buffered: true });

      // Resource timing
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.recordMetric({
              name: 'api_request',
              value: entry.responseEnd - entry.requestStart,
              category: 'api',
              metadata: {
                url: entry.name,
                method: 'GET', // Would need to be enhanced to capture actual method
                size: entry.transferSize
              }
            });
          }
        });
      }).observe({ type: 'resource', buffered: true });

    } catch (error) {
      console.warn('Performance observers setup failed:', error);
    }
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-this.maxStoredMetrics);
    }

    // Check for threshold violations
    this.checkThresholds(fullMetric);
  }

  /**
   * Record API call performance
   */
  public recordAPICall(endpoint: string, responseTime: number, success: boolean, metadata?: Record<string, any>): void {
    this.recordMetric({
      name: 'api_call',
      value: responseTime,
      category: 'api',
      metadata: {
        endpoint,
        success,
        ...metadata
      }
    });
  }

  /**
   * Record component render performance
   */
  public recordComponentRender(componentName: string, renderTime: number, metadata?: Record<string, any>): void {
    this.recordMetric({
      name: 'component_render',
      value: renderTime,
      category: 'render',
      metadata: {
        component: componentName,
        ...metadata
      }
    });
  }

  /**
   * Record user interaction performance
   */
  public recordInteraction(interactionType: string, responseTime: number, metadata?: Record<string, any>): void {
    this.recordMetric({
      name: 'user_interaction',
      value: responseTime,
      category: 'interaction',
      metadata: {
        type: interactionType,
        ...metadata
      }
    });
  }

  /**
   * Create a performance measurement wrapper for functions
   */
  public measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name: string,
    category: PerformanceMetric['category'] = 'api'
  ): T {
    return ((...args: any[]) => {
      const startTime = performance.now();
      
      try {
        const result = fn(...args);
        
        // Handle both sync and async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            const endTime = performance.now();
            this.recordMetric({
              name,
              value: endTime - startTime,
              category,
              metadata: { async: true, args: args.length }
            });
          });
        } else {
          const endTime = performance.now();
          this.recordMetric({
            name,
            value: endTime - startTime,
            category,
            metadata: { async: false, args: args.length }
          });
          return result;
        }
      } catch (error) {
        const endTime = performance.now();
        this.recordMetric({
          name,
          value: endTime - startTime,
          category,
          metadata: { error: true, args: args.length }
        });
        throw error;
      }
    }) as T;
  }

  /**
   * Check if a metric violates performance thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds[metric.name];
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      console.warn(`🚨 Critical performance issue: ${metric.name} = ${metric.value}${threshold.unit} (threshold: ${threshold.critical}${threshold.unit})`);
    } else if (metric.value >= threshold.warning) {
      console.warn(`⚠️ Performance warning: ${metric.name} = ${metric.value}${threshold.unit} (threshold: ${threshold.warning}${threshold.unit})`);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  public generateReport(timeRange?: { start: Date; end: Date }): PerformanceReport {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const startTime = timeRange?.start.getTime() || oneHourAgo;
    const endTime = timeRange?.end.getTime() || now;
    
    const filteredMetrics = this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    // API metrics
    const apiMetrics = filteredMetrics.filter(m => m.category === 'api');
    const apiResponseTimes = apiMetrics.map(m => m.value);
    const averageApiResponseTime = apiResponseTimes.length > 0
      ? apiResponseTimes.reduce((sum, time) => sum + time, 0) / apiResponseTimes.length
      : 0;

    // Group by endpoint for API analysis
    const apiEndpoints: Record<string, { times: number[]; count: number }> = {};
    apiMetrics.forEach(metric => {
      const endpoint = metric.metadata?.endpoint || metric.metadata?.url || 'unknown';
      if (!apiEndpoints[endpoint]) {
        apiEndpoints[endpoint] = { times: [], count: 0 };
      }
      apiEndpoints[endpoint].times.push(metric.value);
      apiEndpoints[endpoint].count++;
    });

    const slowestEndpoints = Object.entries(apiEndpoints)
      .map(([endpoint, data]) => ({
        endpoint,
        averageTime: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
        count: data.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // Render metrics
    const renderMetrics = filteredMetrics.filter(m => m.category === 'render');
    const renderTimes = renderMetrics.map(m => m.value);
    const averageRenderTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      : 0;

    // Group by component for render analysis
    const renderComponents: Record<string, { times: number[]; count: number }> = {};
    renderMetrics.forEach(metric => {
      const component = metric.metadata?.component || 'unknown';
      if (!renderComponents[component]) {
        renderComponents[component] = { times: [], count: 0 };
      }
      renderComponents[component].times.push(metric.value);
      renderComponents[component].count++;
    });

    const slowestComponents = Object.entries(renderComponents)
      .map(([component, data]) => ({
        component,
        averageTime: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
        count: data.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    // Web Vitals
    const lcpMetric = filteredMetrics.find(m => m.name === 'largest_contentful_paint');
    const fidMetric = filteredMetrics.find(m => m.name === 'first_input_delay');
    const clsMetric = filteredMetrics.find(m => m.name === 'cumulative_layout_shift');
    const fcpMetric = filteredMetrics.find(m => m.name === 'first_contentful_paint');

    // Error rate calculation
    const errorRate = apiMetrics.length > 0
      ? (apiMetrics.filter(m => !m.metadata?.success).length / apiMetrics.length) * 100
      : 0;

    // Overall health assessment
    let overallHealth: 'good' | 'warning' | 'critical' = 'good';
    if (
      averageApiResponseTime > this.thresholds.apiResponseTime.critical ||
      averageRenderTime > this.thresholds.renderTime.critical ||
      errorRate > this.thresholds.errorRate.critical
    ) {
      overallHealth = 'critical';
    } else if (
      averageApiResponseTime > this.thresholds.apiResponseTime.warning ||
      averageRenderTime > this.thresholds.renderTime.warning ||
      errorRate > this.thresholds.errorRate.warning
    ) {
      overallHealth = 'warning';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageApiResponseTime > this.thresholds.apiResponseTime.warning) {
      recommendations.push('Consider implementing API response caching or optimizing slow endpoints');
    }
    if (averageRenderTime > this.thresholds.renderTime.warning) {
      recommendations.push('Optimize component rendering with React.memo or useMemo');
    }
    if (errorRate > this.thresholds.errorRate.warning) {
      recommendations.push('Investigate and fix API errors to improve reliability');
    }
    if (lcpMetric && lcpMetric.value > 2500) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes or server response times');
    }
    if (clsMetric && clsMetric.value > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by reserving space for dynamic content');
    }

    return {
      summary: {
        totalMetrics: filteredMetrics.length,
        timeRange: {
          start: new Date(startTime).toISOString(),
          end: new Date(endTime).toISOString()
        },
        overallHealth
      },
      apiMetrics: {
        averageResponseTime: Math.round(averageApiResponseTime * 100) / 100,
        slowestEndpoints,
        errorRate: Math.round(errorRate * 100) / 100,
        totalRequests: apiMetrics.length
      },
      renderMetrics: {
        averageRenderTime: Math.round(averageRenderTime * 100) / 100,
        slowestComponents,
        totalRenders: renderMetrics.length
      },
      userExperience: {
        firstContentfulPaint: fcpMetric?.value || 0,
        largestContentfulPaint: lcpMetric?.value || 0,
        cumulativeLayoutShift: clsMetric?.value || 0,
        firstInputDelay: fidMetric?.value || 0
      },
      recommendations
    };
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): {
    metrics: PerformanceMetric[];
    thresholds: Record<string, PerformanceThreshold>;
    report: PerformanceReport;
    exportTime: string;
  } {
    return {
      metrics: [...this.metrics],
      thresholds: { ...this.thresholds },
      report: this.generateReport(),
      exportTime: new Date().toISOString()
    };
  }

  /**
   * Clear all stored metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    console.log('📊 Performance metrics cleared');
  }

  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📊 Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update performance thresholds
   */
  public updateThresholds(newThresholds: Partial<Record<string, PerformanceThreshold>>): void {
    Object.entries(newThresholds).forEach(([key, value]) => {
      if (value) {
        this.thresholds[key] = value;
      }
    });
    console.log('📊 Performance thresholds updated');
  }

  /**
   * Generate a simple session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clean up old metrics periodically
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      const initialLength = this.metrics.length;
      
      this.metrics = this.metrics.filter(m => m.timestamp > twoHoursAgo);
      
      const removedCount = initialLength - this.metrics.length;
      if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} old performance metrics`);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance measurement decorators and utilities
export function measurePerformance(name: string, category: PerformanceMetric['category'] = 'api') {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = performanceMonitor.measureFunction(originalMethod, name, category);
    
    return descriptor;
  };
}

// React hook for component performance measurement
export function usePerformanceMeasurement(componentName: string) {
  const measureRender = (renderTime: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordComponentRender(componentName, renderTime, metadata);
  };

  const measureInteraction = (interactionType: string, responseTime: number, metadata?: Record<string, any>) => {
    performanceMonitor.recordInteraction(interactionType, responseTime, metadata);
  };

  return { measureRender, measureInteraction };
}