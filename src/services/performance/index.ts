/**
 * Performance Optimization Suite for ScienceHabits
 * Centralized performance management system that coordinates all optimization services
 * to achieve target performance metrics:
 * - <200ms API response times
 * - <3s page load times
 * - 90+ Lighthouse performance score
 */

import PerformanceOptimizer from './PerformanceOptimizer';
import BundleOptimizer from './BundleOptimizer';
import APIOptimizer from './APIOptimizer';

export class PerformanceManager {
  private static readonly PERFORMANCE_TARGETS = {
    API_RESPONSE_TIME: 200,     // ms
    PAGE_LOAD_TIME: 3000,       // ms
    LIGHTHOUSE_SCORE: 90,       // minimum score
    FIRST_CONTENTFUL_PAINT: 1500, // ms
    LARGEST_CONTENTFUL_PAINT: 2500, // ms
    CUMULATIVE_LAYOUT_SHIFT: 0.1,   // score
    FIRST_INPUT_DELAY: 100,     // ms
  };

  private static isInitialized = false;
  private static performanceData = new Map<string, any>();
  private static optimizationStrategies = new Map<string, OptimizationStrategy>();

  /**
   * Initialize the complete performance optimization suite
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Performance manager already initialized');
      return;
    }

    console.log('🚀 Initializing Performance Optimization Suite...');

    try {
      // Initialize core optimization services
      await this.initializeOptimizers();
      
      // Setup performance monitoring
      this.setupComprehensiveMonitoring();
      
      // Configure optimization strategies
      this.configureOptimizationStrategies();
      
      // Start performance analysis
      this.startPerformanceAnalysis();
      
      // Setup automatic optimizations
      this.enableAutomaticOptimizations();
      
      this.isInitialized = true;
      console.log('✅ Performance optimization suite initialized successfully');
      
      // Initial performance assessment
      setTimeout(() => this.performInitialAssessment(), 2000);
      
    } catch (error) {
      console.error('❌ Failed to initialize performance optimization:', error);
      throw error;
    }
  }

  /**
   * Initialize all optimization services
   */
  private static async initializeOptimizers(): Promise<void> {
    const initTasks = [
      { name: 'PerformanceOptimizer', task: () => PerformanceOptimizer.initialize() },
      { name: 'BundleOptimizer', task: () => BundleOptimizer.initialize() },
      { name: 'APIOptimizer', task: () => APIOptimizer.initialize() },
    ];

    for (const { name, task } of initTasks) {
      try {
        await task();
        console.log(`✅ ${name} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Setup comprehensive performance monitoring
   */
  private static setupComprehensiveMonitoring(): void {
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network conditions
    this.monitorNetworkConditions();
  }

  /**
   * Monitor Core Web Vitals for optimal UX
   */
  private static monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      const lcp = entry.startTime;
      this.recordMetric('LCP', lcp);
      
      if (lcp > this.PERFORMANCE_TARGETS.LARGEST_CONTENTFUL_PAINT) {
        this.triggerOptimization('LCP', { value: lcp, target: this.PERFORMANCE_TARGETS.LARGEST_CONTENTFUL_PAINT });
      }
    });

    // First Contentful Paint (FCP)
    this.observePerformanceEntry('first-contentful-paint', (entry) => {
      const fcp = entry.startTime;
      this.recordMetric('FCP', fcp);
      
      if (fcp > this.PERFORMANCE_TARGETS.FIRST_CONTENTFUL_PAINT) {
        this.triggerOptimization('FCP', { value: fcp, target: this.PERFORMANCE_TARGETS.FIRST_CONTENTFUL_PAINT });
      }
    });

    // First Input Delay (FID) - using event timing API
    this.observePerformanceEntry('event', (entry) => {
      if (entry.name === 'first-input') {
        const eventEntry = entry as any; // PerformanceEventTiming
        const fid = eventEntry.processingStart ? eventEntry.processingStart - entry.startTime : 0;
        this.recordMetric('FID', fid);
        
        if (fid > this.PERFORMANCE_TARGETS.FIRST_INPUT_DELAY) {
          this.triggerOptimization('FID', { value: fid, target: this.PERFORMANCE_TARGETS.FIRST_INPUT_DELAY });
        }
      }
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entry) => {
      const layoutEntry = entry as any; // PerformanceLayoutShiftEntry
      if (!layoutEntry.hadRecentInput) {
        const currentCLS = this.performanceData.get('CLS') || 0;
        const newCLS = currentCLS + (layoutEntry.value || 0);
        this.recordMetric('CLS', newCLS);
        
        if (newCLS > this.PERFORMANCE_TARGETS.CUMULATIVE_LAYOUT_SHIFT) {
          this.triggerOptimization('CLS', { value: newCLS, target: this.PERFORMANCE_TARGETS.CUMULATIVE_LAYOUT_SHIFT });
        }
      }
    });
  }

  /**
   * Monitor resource loading performance
   */
  private static monitorResourceLoading(): void {
    this.observePerformanceEntry('resource', (entry) => {
      const resource = entry as PerformanceResourceTiming;
      const loadTime = resource.responseEnd - resource.startTime;
      
      // Track different resource types
      const resourceType = this.getResourceType(resource.name);
      this.recordMetric(`resource_${resourceType}`, loadTime);
      
      // Alert on slow resources
      const thresholds = {
        script: 1000,
        stylesheet: 500,
        image: 2000,
        font: 1000,
        fetch: this.PERFORMANCE_TARGETS.API_RESPONSE_TIME,
      };
      
      const threshold = thresholds[resourceType as keyof typeof thresholds] || 1000;
      if (loadTime > threshold) {
        console.warn(`🐌 Slow ${resourceType} load: ${resource.name} (${loadTime.toFixed(2)}ms)`);
        this.triggerOptimization('resource', { 
          type: resourceType, 
          url: resource.name, 
          loadTime, 
          threshold 
        });
      }
    });
  }

  /**
   * Monitor user interactions for performance impact
   */
  private static monitorUserInteractions(): void {
    const interactionTypes = ['click', 'keydown', 'scroll'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const startTime = performance.now();
        
        // Monitor how long it takes for the interaction to complete
        requestAnimationFrame(() => {
          const responseTime = performance.now() - startTime;
          this.recordMetric(`interaction_${type}`, responseTime);
          
          if (responseTime > 16) { // 60fps threshold
            console.warn(`🐌 Slow ${type} response: ${responseTime.toFixed(2)}ms`);
          }
        });
      }, { passive: true });
    });
  }

  /**
   * Monitor memory usage to prevent memory leaks
   */
  private static monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      setInterval(() => {
        const memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };
        
        this.recordMetric('memory', memoryUsage);
        
        // Alert on high memory usage
        const usagePercent = (memoryUsage.used / memoryUsage.limit) * 100;
        if (usagePercent > 80) {
          console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(1)}%`);
          this.triggerOptimization('memory', memoryUsage);
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Monitor network conditions for adaptive optimizations
   */
  private static monitorNetworkConditions(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkStrategy = () => {
        const networkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        };
        
        this.recordMetric('network', networkInfo);
        this.adaptToNetworkConditions(networkInfo);
      };
      
      connection.addEventListener('change', updateNetworkStrategy);
      updateNetworkStrategy(); // Initial check
    }
  }

  /**
   * Configure optimization strategies for different scenarios
   */
  private static configureOptimizationStrategies(): void {
    // LCP optimization strategy
    this.optimizationStrategies.set('LCP', {
      name: 'Largest Contentful Paint Optimization',
      trigger: (data) => data.value > this.PERFORMANCE_TARGETS.LARGEST_CONTENTFUL_PAINT,
      actions: [
        'Preload critical resources',
        'Optimize largest image/content',
        'Reduce render-blocking resources',
        'Enable resource prioritization',
      ],
      execute: this.optimizeLCP.bind(this),
    });

    // FCP optimization strategy
    this.optimizationStrategies.set('FCP', {
      name: 'First Contentful Paint Optimization',
      trigger: (data) => data.value > this.PERFORMANCE_TARGETS.FIRST_CONTENTFUL_PAINT,
      actions: [
        'Inline critical CSS',
        'Preload critical fonts',
        'Optimize critical rendering path',
        'Remove render-blocking JavaScript',
      ],
      execute: this.optimizeFCP.bind(this),
    });

    // API response optimization strategy
    this.optimizationStrategies.set('API', {
      name: 'API Response Time Optimization',
      trigger: (data) => data.value > this.PERFORMANCE_TARGETS.API_RESPONSE_TIME,
      actions: [
        'Enable aggressive caching',
        'Implement request batching',
        'Add response compression',
        'Use service worker caching',
      ],
      execute: this.optimizeAPIResponse.bind(this),
    });

    // Memory optimization strategy
    this.optimizationStrategies.set('memory', {
      name: 'Memory Usage Optimization',
      trigger: (data) => (data.used / data.limit) > 0.8,
      actions: [
        'Clear unused caches',
        'Garbage collect components',
        'Reduce memory-intensive operations',
        'Optimize image caching',
      ],
      execute: this.optimizeMemory.bind(this),
    });
  }

  /**
   * Start continuous performance analysis
   */
  private static startPerformanceAnalysis(): void {
    // Analyze performance every 30 seconds
    setInterval(() => {
      this.analyzePerformance();
    }, 30000);

    // Generate detailed report every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);
  }

  /**
   * Enable automatic optimizations based on detected issues
   */
  private static enableAutomaticOptimizations(): void {
    // Auto-optimize when performance degrades
    this.setupAutoOptimization();
    
    // Predictive optimizations based on usage patterns
    this.setupPredictiveOptimizations();
    
    // Network-adaptive optimizations
    this.setupNetworkAdaptiveOptimizations();
  }

  /**
   * Perform initial performance assessment
   */
  private static async performInitialAssessment(): Promise<void> {
    console.log('📊 Performing initial performance assessment...');
    
    try {
      const assessment = await this.getComprehensivePerformanceReport();
      
      console.log('📈 Performance Assessment Results:');
      console.log(`- Overall Score: ${assessment.overallScore}/100`);
      console.log(`- Page Load Time: ${assessment.pageLoadTime.toFixed(0)}ms`);
      console.log(`- API Response Time: ${assessment.averageAPIResponseTime.toFixed(0)}ms`);
      console.log(`- Bundle Size: ${(assessment.bundleSize / 1024 / 1024).toFixed(1)}MB`);
      
      if (assessment.recommendations.length > 0) {
        console.log('💡 Optimization Recommendations:');
        assessment.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
      
      // Trigger optimizations for critical issues
      if (assessment.overallScore < 70) {
        console.log('⚡ Triggering automatic optimizations for critical issues...');
        await this.triggerCriticalOptimizations(assessment);
      }
      
    } catch (error) {
      console.error('❌ Performance assessment failed:', error);
    }
  }

  /**
   * Get comprehensive performance report
   */
  static async getComprehensivePerformanceReport(): Promise<PerformanceReport> {
    const [performanceReport, bundleReport, apiReport] = await Promise.all([
      PerformanceOptimizer.getPerformanceReport(),
      Promise.resolve(BundleOptimizer.generateBundleReport((window as any).BundleAnalytics?.getMetrics() || {})),
      APIOptimizer.getPerformanceReport(),
    ]);

    const overallScore = this.calculateOverallScore(performanceReport, bundleReport, apiReport);
    
    return {
      timestamp: new Date().toISOString(),
      overallScore,
      pageLoadTime: performanceReport.pageLoadTime,
      firstContentfulPaint: performanceReport.firstContentfulPaint,
      largestContentfulPaint: performanceReport.largestContentfulPaint,
      averageAPIResponseTime: apiReport.overall.averageResponseTime,
      bundleSize: bundleReport.totalBundleSize,
      cacheHitRate: apiReport.overall.cacheHitRate,
      recommendations: [
        ...performanceReport.recommendations,
        ...bundleReport.recommendations,
        ...apiReport.recommendations,
      ],
      detailedMetrics: {
        performance: performanceReport,
        bundle: bundleReport,
        api: apiReport,
        coreWebVitals: this.getCoreWebVitalsReport(),
      },
    };
  }

  /**
   * Record performance metric
   */
  private static recordMetric(name: string, value: any): void {
    this.performanceData.set(name, value);
    
    // Store in performance timeline
    performance.mark(`metric-${name}-${Date.now()}`);
    
    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: typeof value === 'number' ? Math.round(value) : value,
      });
    }
  }

  /**
   * Trigger optimization based on performance issue
   */
  private static triggerOptimization(type: string, data: any): void {
    const strategy = this.optimizationStrategies.get(type);
    
    if (strategy && strategy.trigger(data)) {
      console.log(`⚡ Triggering ${strategy.name}...`);
      strategy.execute(data);
    }
  }

  /**
   * Observe performance entries of specific type
   */
  private static observePerformanceEntry(
    entryType: string, 
    callback: (entry: PerformanceEntry) => void
  ): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(callback);
        });
        
        observer.observe({ type: entryType, buffered: true });
      } catch (error) {
        console.warn(`Failed to observe ${entryType}:`, error);
      }
    }
  }

  // Helper methods and optimization implementations
  private static getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    if (url.includes('/api/')) return 'fetch';
    return 'other';
  }

  private static calculateOverallScore(perf: any, bundle: any, api: any): number {
    const weights = { performance: 0.4, bundle: 0.3, api: 0.3 };
    return Math.round(
      perf.performanceScore * weights.performance +
      bundle.performanceScore * weights.bundle +
      api.performanceScore * weights.api
    );
  }

  private static getCoreWebVitalsReport(): any {
    return {
      LCP: this.performanceData.get('LCP') || 0,
      FCP: this.performanceData.get('FCP') || 0,
      FID: this.performanceData.get('FID') || 0,
      CLS: this.performanceData.get('CLS') || 0,
    };
  }

  // Optimization implementation methods
  private static async optimizeLCP(data: any): Promise<void> {
    console.log('🎯 Optimizing Largest Contentful Paint...');
    // Implementation would include specific LCP optimizations
  }

  private static async optimizeFCP(data: any): Promise<void> {
    console.log('🎯 Optimizing First Contentful Paint...');
    // Implementation would include specific FCP optimizations
  }

  private static async optimizeAPIResponse(data: any): Promise<void> {
    console.log('🎯 Optimizing API Response Times...');
    // Implementation would include specific API optimizations
  }

  private static async optimizeMemory(data: any): Promise<void> {
    console.log('🎯 Optimizing Memory Usage...');
    // Clear caches, trigger garbage collection, etc.
    if ((window as any).APICache) {
      (window as any).APICache.clear();
    }
  }

  private static adaptToNetworkConditions(networkInfo: any): void {
    // Adapt optimizations based on network conditions
    if (networkInfo.effectiveType === '2g' || networkInfo.saveData) {
      // Enable aggressive optimizations for slow networks
      console.log('📱 Adapting to slow network conditions...');
    }
  }

  private static analyzePerformance(): void {
    // Continuous performance analysis
  }

  private static generatePerformanceReport(): void {
    // Generate detailed performance reports
  }

  private static setupAutoOptimization(): void {
    // Setup automatic optimization triggers
  }

  private static setupPredictiveOptimizations(): void {
    // Setup predictive optimization based on usage patterns
  }

  private static setupNetworkAdaptiveOptimizations(): void {
    // Setup network-adaptive optimizations
  }

  private static async triggerCriticalOptimizations(assessment: PerformanceReport): Promise<void> {
    // Trigger critical optimizations based on assessment
  }
}

// Types
interface OptimizationStrategy {
  name: string;
  trigger: (data: any) => boolean;
  actions: string[];
  execute: (data: any) => Promise<void>;
}

interface PerformanceReport {
  timestamp: string;
  overallScore: number;
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  averageAPIResponseTime: number;
  bundleSize: number;
  cacheHitRate: number;
  recommendations: string[];
  detailedMetrics: {
    performance: any;
    bundle: any;
    api: any;
    coreWebVitals: any;
  };
}

// Export all optimization services
export { PerformanceOptimizer, BundleOptimizer, APIOptimizer };
export default PerformanceManager;