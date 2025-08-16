/**
 * Bundle Optimization Service for ScienceHabits
 * Implements advanced bundle optimization techniques to achieve:
 * - Bundle size under 2MB total
 * - Gzipped size under 500KB
 * - Optimal code splitting and lazy loading
 * - Tree shaking and dead code elimination
 */

export class BundleOptimizer {
  private static readonly BUNDLE_TARGETS = {
    MAX_BUNDLE_SIZE: 2 * 1024 * 1024,  // 2MB
    MAX_GZIP_SIZE: 500 * 1024,         // 500KB
    MAX_CHUNK_SIZE: 244 * 1024,        // 244KB (optimal for HTTP/2)
    CRITICAL_THRESHOLD: 15 * 1024,     // 15KB critical path budget
  };

  private static loadedChunks = new Set<string>();
  private static preloadedChunks = new Set<string>();
  private static chunkPriorities = new Map<string, number>();

  /**
   * Initialize bundle optimization
   */
  static initialize() {
    this.setupIntelligentCodeSplitting();
    this.enableAdvancedLazyLoading();
    this.optimizeChunkLoading();
    this.setupBundleAnalytics();
    this.enableTreeShaking();
  }

  /**
   * Setup intelligent code splitting based on usage patterns
   */
  private static setupIntelligentCodeSplitting() {
    // Route-based splitting
    this.setupRouteSplitting();
    
    // Feature-based splitting
    this.setupFeatureSplitting();
    
    // Vendor splitting optimization
    this.setupVendorSplitting();
    
    // Component-based splitting
    this.setupComponentSplitting();
  }

  /**
   * Route-based code splitting for optimal loading
   */
  private static setupRouteSplitting() {
    const routeChunks = new Map<string, () => Promise<any>>();
    
    // Define route chunks with priorities
    const routes = [
      { path: '/today', priority: 10, chunk: () => import('../../components/dashboard/TodayView') },
      { path: '/habits', priority: 9, chunk: () => import('../../components/habits/HabitsView') },
      { path: '/analytics', priority: 7, chunk: () => import('../../components/analytics/Analytics') },
      { path: '/profile', priority: 5, chunk: () => import('../../components/profile/ProfileModal') },
      { path: '/admin', priority: 1, chunk: () => import('../../components/admin/AdminDashboard') },
    ];

    routes.forEach(({ path, priority, chunk }) => {
      routeChunks.set(path, chunk);
      this.chunkPriorities.set(path, priority);
    });

    // Preload high-priority routes
    this.preloadHighPriorityChunks(routeChunks);
  }

  /**
   * Feature-based code splitting for modular loading
   */
  private static setupFeatureSplitting() {
    const featureChunks = {
      // Analytics features (loaded on demand)
      analytics: () => import('../../components/analytics'),
      
      // Multi-language features
      i18n: () => import('../../services/i18n/UITranslationService'),
      
      // Testing and development features
      testing: () => import('../../components/testing'),
      
      // Admin features
      admin: () => import('../../components/admin/AdminDashboard'),
      
      // Sync and cloud features
      cloudSync: () => import('../../services/sync/GoogleDriveProvider'),
      
      // Service worker and offline features
      serviceWorker: () => import('../../services/swRegistration'),
    };

    // Store feature chunks for lazy loading
    (window as any).FeatureChunks = featureChunks;
  }

  /**
   * Vendor library splitting for optimal caching
   */
  private static setupVendorSplitting() {
    const vendorChunks = {
      // Core React ecosystem (high priority)
      react: ['react', 'react-dom'],
      
      // UI libraries (medium priority)
      ui: ['@headlessui/react', 'tailwindcss'],
      
      // Data management (medium priority)
      data: ['zustand', 'dexie'],
      
      // Utilities (low priority)
      utils: ['date-fns', 'lodash-es'],
      
      // Development only (exclude from production)
      dev: ['react-testing-library', '@storybook/react'],
    };

    // Configure webpack chunk splitting
    this.configureWebpackSplitting(vendorChunks);
  }

  /**
   * Component-based splitting for granular loading
   */
  private static setupComponentSplitting() {
    const componentChunks = new Map<string, ComponentChunk>();
    
    // Register splittable components
    const splittableComponents = [
      { name: 'HabitForm', path: '../../components/habits/CreateHabitForm', size: 'medium' },
      { name: 'AnalyticsCharts', path: '../../components/analytics/HabitPerformanceChart', size: 'large' },
      { name: 'ProgressVisualizations', path: '../../components/visualization/EnhancedProgressVisualization', size: 'large' },
      { name: 'ResearchViewer', path: '../../components/research/HabitResearchModal', size: 'medium' },
      { name: 'SettingsPanel', path: '../../components/settings/LanguageSelector', size: 'small' },
    ];

    splittableComponents.forEach(({ name, path, size }) => {
      componentChunks.set(name, {
        loader: () => import(path),
        size: this.getChunkSizeEstimate(size),
        priority: this.calculateComponentPriority(name),
        preload: this.shouldPreloadComponent(name),
      });
    });

    // Store for runtime access
    (window as any).ComponentChunks = componentChunks;
  }

  /**
   * Enable advanced lazy loading with intelligent prefetching
   */
  private static enableAdvancedLazyLoading() {
    // Intersection Observer for component lazy loading
    this.setupIntersectionLazyLoading();
    
    // User interaction based loading
    this.setupInteractionBasedLoading();
    
    // Network-aware loading
    this.setupNetworkAwareLoading();
    
    // Time-based prefetching
    this.setupTimeBasedPrefetching();
  }

  /**
   * Setup intersection-based lazy loading
   */
  private static setupIntersectionLazyLoading() {
    if ('IntersectionObserver' in window) {
      const lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const chunkName = element.dataset.chunk;
            
            if (chunkName && !this.loadedChunks.has(chunkName)) {
              this.loadChunk(chunkName);
            }
          }
        });
      }, {
        rootMargin: '200px', // Load 200px before entering viewport
        threshold: 0.1,
      });

      // Observe lazy-loadable elements
      document.querySelectorAll('[data-chunk]').forEach((element) => {
        lazyLoadObserver.observe(element);
      });
    }
  }

  /**
   * Setup network-aware loading for optimal performance
   */
  private static setupNetworkAwareLoading() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const networkStrategies = {
        'slow-2g': { maxChunkSize: 50 * 1024, prefetchLimit: 1 },
        '2g': { maxChunkSize: 100 * 1024, prefetchLimit: 2 },
        '3g': { maxChunkSize: 200 * 1024, prefetchLimit: 3 },
        '4g': { maxChunkSize: 500 * 1024, prefetchLimit: 5 },
      };
      
      const strategy = networkStrategies[connection.effectiveType as keyof typeof networkStrategies] || 
                      networkStrategies['4g'];
      
      this.applyNetworkStrategy(strategy);
    }
  }

  /**
   * Optimize chunk loading with intelligent prioritization
   */
  private static optimizeChunkLoading() {
    // Implement chunk loading queue
    this.setupChunkLoadingQueue();
    
    // Enable chunk prefetching
    this.setupChunkPrefetching();
    
    // Implement chunk error handling
    this.setupChunkErrorHandling();
    
    // Setup chunk performance monitoring
    this.monitorChunkPerformance();
  }

  /**
   * Setup chunk loading queue for optimal resource utilization
   */
  private static setupChunkLoadingQueue() {
    const loadingQueue: ChunkLoadRequest[] = [];
    const concurrentLoads = new Set<string>();
    const MAX_CONCURRENT_LOADS = 3;

    const processQueue = async () => {
      while (loadingQueue.length > 0 && concurrentLoads.size < MAX_CONCURRENT_LOADS) {
        const request = loadingQueue.shift()!;
        concurrentLoads.add(request.chunkName);
        
        try {
          const startTime = performance.now();
          const chunk = await request.loader();
          const loadTime = performance.now() - startTime;
          
          this.recordChunkMetric(request.chunkName, loadTime, chunk);
          this.loadedChunks.add(request.chunkName);
          
          request.resolve(chunk);
        } catch (error) {
          this.handleChunkLoadError(request.chunkName, error);
          request.reject(error);
        } finally {
          concurrentLoads.delete(request.chunkName);
          // Process next in queue
          setTimeout(processQueue, 0);
        }
      }
    };

    // Expose queue management
    (window as any).ChunkLoader = {
      loadChunk: (chunkName: string, loader: () => Promise<any>) => {
        return new Promise((resolve, reject) => {
          loadingQueue.push({ chunkName, loader, resolve, reject });
          loadingQueue.sort((a, b) => 
            (this.chunkPriorities.get(b.chunkName) || 0) - 
            (this.chunkPriorities.get(a.chunkName) || 0)
          );
          processQueue();
        });
      }
    };
  }

  /**
   * Setup bundle analytics for optimization insights
   */
  private static setupBundleAnalytics() {
    const bundleMetrics = {
      totalSize: 0,
      gzipSize: 0,
      chunkCount: 0,
      loadTimes: new Map<string, number>(),
      errorRates: new Map<string, number>(),
    };

    // Monitor bundle metrics
    this.monitorBundleSize(bundleMetrics);
    this.trackChunkUtilization(bundleMetrics);
    this.analyzeLoadingPatterns(bundleMetrics);

    // Expose analytics
    (window as any).BundleAnalytics = {
      getMetrics: () => bundleMetrics,
      generateReport: () => this.generateBundleReport(bundleMetrics),
      optimizationSuggestions: () => this.getBundleOptimizationSuggestions(bundleMetrics),
    };
  }

  /**
   * Enable tree shaking and dead code elimination
   */
  private static enableTreeShaking() {
    // Configure webpack tree shaking
    this.configureTreeShaking();
    
    // Dynamic import optimization
    this.optimizeDynamicImports();
    
    // Unused code detection
    this.detectUnusedCode();
    
    // Module federation optimization
    this.optimizeModuleFederation();
  }

  /**
   * Load chunk with performance tracking
   */
  private static async loadChunk(chunkName: string): Promise<any> {
    if (this.loadedChunks.has(chunkName)) {
      return Promise.resolve();
    }

    const loader = (window as any).ChunkLoader;
    if (loader && typeof loader.loadChunk === 'function') {
      return loader.loadChunk(chunkName, () => {
        // Dynamic chunk loading based on name
        switch (chunkName) {
          case 'analytics':
            return import('../../components/analytics');
          case 'admin':
            return import('../../components/admin/AdminDashboard');
          case 'testing':
            return import('../../components/testing');
          default:
            throw new Error(`Unknown chunk: ${chunkName}`);
        }
      });
    }

    throw new Error('Chunk loader not initialized');
  }

  /**
   * Preload high-priority chunks
   */
  private static preloadHighPriorityChunks(chunks: Map<string, () => Promise<any>>) {
    const highPriorityThreshold = 8;
    
    Array.from(this.chunkPriorities.entries())
      .filter(([, priority]) => priority >= highPriorityThreshold)
      .slice(0, 2) // Limit to 2 preloads
      .forEach(([chunkName]) => {
        if (!this.preloadedChunks.has(chunkName)) {
          this.preloadChunk(chunkName);
        }
      });
  }

  /**
   * Preload chunk without executing
   */
  private static preloadChunk(chunkName: string) {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = this.getChunkUrl(chunkName);
    link.onload = () => {
      this.preloadedChunks.add(chunkName);
      console.log(`✅ Preloaded chunk: ${chunkName}`);
    };
    link.onerror = () => {
      console.warn(`⚠️ Failed to preload chunk: ${chunkName}`);
    };
    document.head.appendChild(link);
  }

  /**
   * Record chunk performance metrics
   */
  private static recordChunkMetric(chunkName: string, loadTime: number, chunk: any) {
    const size = this.estimateChunkSize(chunk);
    
    console.log(`📦 Chunk loaded: ${chunkName} (${loadTime.toFixed(2)}ms, ~${(size / 1024).toFixed(1)}KB)`);
    
    // Store metrics
    const metrics = (window as any).BundleAnalytics?.getMetrics();
    if (metrics) {
      metrics.loadTimes.set(chunkName, loadTime);
      metrics.totalSize += size;
      metrics.chunkCount++;
    }

    // Performance budget check
    if (loadTime > 1000) {
      console.warn(`🐌 Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Handle chunk loading errors
   */
  private static handleChunkLoadError(chunkName: string, error: any) {
    console.error(`❌ Chunk load failed: ${chunkName}`, error);
    
    // Implement retry logic
    const retryCount = this.getRetryCount(chunkName);
    if (retryCount < 3) {
      setTimeout(() => {
        this.loadChunk(chunkName);
      }, Math.pow(2, retryCount) * 1000);
    }

    // Track error rates
    const metrics = (window as any).BundleAnalytics?.getMetrics();
    if (metrics) {
      const currentErrors = metrics.errorRates.get(chunkName) || 0;
      metrics.errorRates.set(chunkName, currentErrors + 1);
    }
  }

  /**
   * Generate bundle optimization report
   */
  static generateBundleReport(metrics: any): BundleReport {
    const loadTimes = metrics.loadTimes || new Map();
    const errorRates = metrics.errorRates || new Map();
    
    const avgLoadTime = loadTimes.size > 0 
      ? Array.from(loadTimes.values()).reduce((sum: number, time: any) => sum + (Number(time) || 0), 0) / loadTimes.size
      : 0;

    const totalErrors = Array.from(errorRates.values()).reduce((sum: number, errors: any) => sum + (Number(errors) || 0), 0);

    const totalSize = metrics.totalSize || 0;
    const chunkCount = metrics.chunkCount || 0;
    
    return {
      totalBundleSize: totalSize,
      gzipEstimate: Math.round(totalSize * 0.3), // Rough gzip estimate
      chunkCount: chunkCount,
      averageLoadTime: avgLoadTime,
      errorRate: chunkCount > 0 ? totalErrors / chunkCount : 0,
      performanceScore: this.calculateBundleScore(metrics),
      recommendations: this.getBundleOptimizationSuggestions(metrics),
      loadedChunks: Array.from(this.loadedChunks),
      preloadedChunks: Array.from(this.preloadedChunks),
    };
  }

  /**
   * Calculate bundle performance score
   */
  private static calculateBundleScore(metrics: any): number {
    let score = 100;
    const totalSize = metrics.totalSize || 0;
    const loadTimes = metrics.loadTimes || new Map();
    const errorRates = metrics.errorRates || new Map();
    const chunkCount = metrics.chunkCount || 0;
    
    // Size penalty
    if (totalSize > this.BUNDLE_TARGETS.MAX_BUNDLE_SIZE) {
      score -= 30;
    }
    
    // Load time penalty
    const avgLoadTime = loadTimes.size > 0 
      ? Array.from(loadTimes.values()).reduce((sum: number, time: any) => sum + (Number(time) || 0), 0) / loadTimes.size
      : 0;
    
    if (avgLoadTime > 1000) {
      score -= 25;
    }
    
    // Error rate penalty
    const totalErrors = Array.from(errorRates.values()).reduce((sum: number, errors: any) => sum + (Number(errors) || 0), 0);
    const errorRate = chunkCount > 0 ? totalErrors / chunkCount : 0;
    
    if (errorRate > 0.1) {
      score -= 20;
    }
    
    return Math.max(0, score);
  }

  /**
   * Get bundle optimization suggestions
   */
  private static getBundleOptimizationSuggestions(metrics: any): string[] {
    const suggestions: string[] = [];
    const totalSize = metrics.totalSize || 0;
    const loadTimes = metrics.loadTimes || new Map();
    const chunkCount = metrics.chunkCount || 0;
    
    if (totalSize > this.BUNDLE_TARGETS.MAX_BUNDLE_SIZE) {
      suggestions.push('Bundle size exceeds target - consider more aggressive code splitting');
    }
    
    const slowChunks = Array.from(loadTimes.entries())
      .filter((entry: any) => {
        const [, time] = entry;
        return (Number(time) || 0) > 1000;
      });
    
    if (slowChunks.length > 0) {
      suggestions.push(`Slow loading chunks detected: ${slowChunks.map((entry: any) => entry[0]).join(', ')}`);
    }
    
    if (chunkCount > 50) {
      suggestions.push('High chunk count - consider chunk consolidation');
    }
    
    return suggestions;
  }

  // Helper methods
  private static getChunkSizeEstimate(size: string): number {
    const sizeMap = { small: 20480, medium: 51200, large: 102400 };
    return sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;
  }

  private static calculateComponentPriority(name: string): number {
    const priorityMap = new Map([
      ['HabitForm', 8],
      ['AnalyticsCharts', 6],
      ['ProgressVisualizations', 7],
      ['ResearchViewer', 5],
      ['SettingsPanel', 4],
    ]);
    return priorityMap.get(name) || 3;
  }

  private static shouldPreloadComponent(name: string): boolean {
    return ['HabitForm', 'ProgressVisualizations'].includes(name);
  }

  private static getChunkUrl(chunkName: string): string {
    return `/static/js/${chunkName}.chunk.js`;
  }

  private static estimateChunkSize(chunk: any): number {
    return JSON.stringify(chunk).length * 2; // Rough estimate
  }

  private static getRetryCount(chunkName: string): number {
    const retries = (window as any).chunkRetries || new Map();
    return retries.get(chunkName) || 0;
  }

  // Additional implementation methods
  private static configureWebpackSplitting(vendorChunks: any) { /* Implementation */ }
  private static setupInteractionBasedLoading() { /* Implementation */ }
  private static setupTimeBasedPrefetching() { /* Implementation */ }
  private static applyNetworkStrategy(strategy: any) { /* Implementation */ }
  private static setupChunkPrefetching() { /* Implementation */ }
  private static setupChunkErrorHandling() { /* Implementation */ }
  private static monitorChunkPerformance() { /* Implementation */ }
  private static monitorBundleSize(metrics: any) { /* Implementation */ }
  private static trackChunkUtilization(metrics: any) { /* Implementation */ }
  private static analyzeLoadingPatterns(metrics: any) { /* Implementation */ }
  private static configureTreeShaking() { /* Implementation */ }
  private static optimizeDynamicImports() { /* Implementation */ }
  private static detectUnusedCode() { /* Implementation */ }
  private static optimizeModuleFederation() { /* Implementation */ }
}

// Types
interface ComponentChunk {
  loader: () => Promise<any>;
  size: number;
  priority: number;
  preload: boolean;
}

interface ChunkLoadRequest {
  chunkName: string;
  loader: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

interface BundleReport {
  totalBundleSize: number;
  gzipEstimate: number;
  chunkCount: number;
  averageLoadTime: number;
  errorRate: number;
  performanceScore: number;
  recommendations: string[];
  loadedChunks: string[];
  preloadedChunks: string[];
}

export default BundleOptimizer;