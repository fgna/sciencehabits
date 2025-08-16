/**
 * Migration Configuration System
 * 
 * Comprehensive system for managing the gradual migration from GitHub Pages
 * to hybrid architecture with feature flags, rollout controls, and monitoring.
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetAudience: 'all' | 'admin' | 'beta' | 'internal';
  environment: 'development' | 'staging' | 'production' | 'all';
  startDate?: string;
  endDate?: string;
  dependencies?: string[];
  metrics: {
    enabled: boolean;
    events: string[];
  };
}

export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'failed';
  startDate?: string;
  endDate?: string;
  rolloutPercentage: number;
  prerequisites: string[];
  features: string[];
  rollbackPlan: {
    triggers: string[];
    steps: string[];
    automaticRollback: boolean;
  };
  monitoring: {
    metrics: string[];
    alerts: string[];
    healthChecks: string[];
  };
}

export interface MigrationConfig {
  version: string;
  lastUpdated: string;
  currentPhase: string;
  environment: 'development' | 'staging' | 'production';
  
  // API Configuration
  apis: {
    githubPages: {
      baseUrl: string;
      enabled: boolean;
      fallbackPriority: number;
    };
    hybridRuntime: {
      baseUrl: string;
      enabled: boolean;
      fallbackPriority: number;
    };
    legacy: {
      baseUrl: string;
      enabled: boolean;
      fallbackPriority: number;
    };
  };
  
  // Feature Flags
  features: Record<string, FeatureFlag>;
  
  // Migration Phases
  phases: Record<string, MigrationPhase>;
  
  // User Segmentation
  userSegments: {
    beta: {
      enabled: boolean;
      criteria: string[];
      percentage: number;
    };
    gradualRollout: {
      enabled: boolean;
      schedule: Array<{
        date: string;
        percentage: number;
        segment: string;
      }>;
    };
  };
  
  // Performance Thresholds
  performance: {
    maxResponseTime: number;
    maxErrorRate: number;
    minSuccessRate: number;
    rollbackThresholds: {
      errorRate: number;
      responseTime: number;
      failureCount: number;
    };
  };
  
  // Monitoring Configuration
  monitoring: {
    enabled: boolean;
    endpoints: string[];
    alertChannels: string[];
    dashboardUrl?: string;
  };
}

export class MigrationConfigManager {
  private config: MigrationConfig | null = null;
  private listeners: Array<(config: MigrationConfig) => void> = [];
  private metricsCollector: (event: string, data: any) => void;

  constructor(metricsCollector?: (event: string, data: any) => void) {
    this.metricsCollector = metricsCollector || (() => {});
    this.loadConfig();
  }

  /**
   * Load migration configuration from various sources
   */
  private async loadConfig(): Promise<void> {
    try {
      // Try to load from environment variables first
      const envConfig = this.loadFromEnvironment();
      
      // Try to load from remote configuration service
      const remoteConfig = await this.loadFromRemote();
      
      // Try to load from local storage
      const localConfig = this.loadFromLocalStorage();
      
      // Merge configurations with priority: remote > env > local > default
      const configs = [
        this.getDefaultConfig(),
        localConfig,
        envConfig,
        remoteConfig
      ].filter((config): config is Partial<MigrationConfig> => config !== null);
      
      this.config = this.mergeConfigs(configs);
      
      this.notifyListeners();
      
      console.log('✅ Migration configuration loaded successfully');
      this.metricsCollector('migration_config_loaded', { 
        version: this.config.version,
        environment: this.config.environment
      });
      
    } catch (error) {
      console.error('❌ Failed to load migration configuration:', error);
      this.config = this.getDefaultConfig();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.metricsCollector('migration_config_load_failed', { error: errorMessage });
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<MigrationConfig> | null {
    try {
      const env = process.env;
      
      if (!env.REACT_APP_MIGRATION_CONFIG_ENABLED) {
        return null;
      }
      
      return {
        environment: (env.REACT_APP_ENV as any) || 'development',
        apis: {
          githubPages: {
            baseUrl: env.REACT_APP_CONTENT_API_URL || '',
            enabled: env.REACT_APP_GITHUB_PAGES_API_ENABLED !== 'false',
            fallbackPriority: parseInt(env.REACT_APP_GITHUB_PAGES_PRIORITY || '1')
          },
          hybridRuntime: {
            baseUrl: env.REACT_APP_HYBRID_API_URL || '',
            enabled: env.REACT_APP_HYBRID_API_ENABLED === 'true',
            fallbackPriority: parseInt(env.REACT_APP_HYBRID_API_PRIORITY || '2')
          },
          legacy: {
            baseUrl: env.REACT_APP_LEGACY_API_URL || '',
            enabled: env.REACT_APP_LEGACY_API_ENABLED === 'true',
            fallbackPriority: parseInt(env.REACT_APP_LEGACY_API_PRIORITY || '3')
          }
        },
        monitoring: {
          enabled: env.REACT_APP_MONITORING_ENABLED === 'true',
          endpoints: env.REACT_APP_MONITORING_ENDPOINTS?.split(',') || [],
          alertChannels: env.REACT_APP_ALERT_CHANNELS?.split(',') || [],
          dashboardUrl: env.REACT_APP_MONITORING_DASHBOARD_URL
        }
      };
    } catch (error) {
      console.warn('Failed to load config from environment:', error);
      return null;
    }
  }

  /**
   * Load configuration from remote service
   */
  private async loadFromRemote(): Promise<Partial<MigrationConfig> | null> {
    try {
      const configUrl = process.env.REACT_APP_MIGRATION_CONFIG_URL;
      if (!configUrl) {
        return null;
      }
      
      const response = await fetch(configUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_CONFIG_API_KEY || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.status}`);
      }
      
      const config = await response.json();
      return config;
      
    } catch (error) {
      console.warn('Failed to load config from remote:', error);
      return null;
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadFromLocalStorage(): Partial<MigrationConfig> | null {
    try {
      const stored = localStorage.getItem('sciencehabits_migration_config');
      if (!stored) {
        return null;
      }
      
      const config = JSON.parse(stored);
      
      // Validate the config age (don't use if older than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const configAge = Date.now() - new Date(config.lastUpdated).getTime();
      
      if (configAge > maxAge) {
        localStorage.removeItem('sciencehabits_migration_config');
        return null;
      }
      
      return config;
      
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
      localStorage.removeItem('sciencehabits_migration_config');
      return null;
    }
  }

  /**
   * Merge multiple configuration objects with priority
   */
  private mergeConfigs(configs: Array<Partial<MigrationConfig>>): MigrationConfig {
    const merged: MigrationConfig = configs[0] as MigrationConfig;
    
    for (let i = 1; i < configs.length; i++) {
      const config = configs[i];
      if (!config) continue;
      
      // Deep merge with priority to later configs
      this.deepMerge(merged, config);
    }
    
    // Update metadata
    merged.lastUpdated = new Date().toISOString();
    merged.version = this.generateConfigVersion(merged);
    
    return merged;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Generate a configuration version hash
   */
  private generateConfigVersion(config: MigrationConfig): string {
    const configString = JSON.stringify(config, null, 0);
    const hash = this.simpleHash(configString);
    return `v${Date.now().toString(36)}-${hash.toString(36)}`;
  }

  /**
   * Simple hash function for version generation
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MigrationConfig {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      currentPhase: 'github_pages_stable',
      environment: 'development',
      
      apis: {
        githubPages: {
          baseUrl: 'https://freya.github.io/sciencehabits-content-api',
          enabled: true,
          fallbackPriority: 1
        },
        hybridRuntime: {
          baseUrl: '',
          enabled: false,
          fallbackPriority: 2
        },
        legacy: {
          baseUrl: '',
          enabled: false,
          fallbackPriority: 3
        }
      },
      
      features: {
        hybrid_api_testing: {
          id: 'hybrid_api_testing',
          name: 'Hybrid API Testing',
          description: 'Enable testing of hybrid runtime API alongside GitHub Pages',
          enabled: false,
          rolloutPercentage: 0,
          targetAudience: 'internal',
          environment: 'development',
          metrics: {
            enabled: true,
            events: ['hybrid_api_request', 'hybrid_api_response', 'hybrid_api_error']
          }
        },
        
        admin_hybrid_controls: {
          id: 'admin_hybrid_controls',
          name: 'Admin Hybrid Controls',
          description: 'Admin dashboard controls for hybrid API management',
          enabled: false,
          rolloutPercentage: 0,
          targetAudience: 'admin',
          environment: 'all',
          dependencies: ['hybrid_api_testing'],
          metrics: {
            enabled: true,
            events: ['admin_hybrid_toggle', 'admin_migration_trigger']
          }
        },
        
        progressive_migration: {
          id: 'progressive_migration',
          name: 'Progressive Migration',
          description: 'Gradual user migration to hybrid architecture',
          enabled: false,
          rolloutPercentage: 0,
          targetAudience: 'beta',
          environment: 'production',
          dependencies: ['hybrid_api_testing', 'admin_hybrid_controls'],
          metrics: {
            enabled: true,
            events: ['user_migrated', 'migration_success', 'migration_rollback']
          }
        }
      },
      
      phases: {
        github_pages_stable: {
          id: 'github_pages_stable',
          name: 'GitHub Pages Stable',
          description: 'Current stable state using GitHub Pages API',
          status: 'completed',
          rolloutPercentage: 100,
          prerequisites: [],
          features: [],
          rollbackPlan: {
            triggers: [],
            steps: [],
            automaticRollback: false
          },
          monitoring: {
            metrics: ['api_response_time', 'api_success_rate', 'content_freshness'],
            alerts: ['api_down', 'high_error_rate'],
            healthChecks: ['github_pages_health']
          }
        },
        
        hybrid_preparation: {
          id: 'hybrid_preparation',
          name: 'Hybrid Architecture Preparation',
          description: 'Prepare infrastructure for hybrid deployment',
          status: 'pending',
          rolloutPercentage: 0,
          prerequisites: ['github_pages_stable'],
          features: ['hybrid_api_testing'],
          rollbackPlan: {
            triggers: ['high_error_rate', 'performance_degradation'],
            steps: ['disable_hybrid_features', 'revert_to_github_pages'],
            automaticRollback: true
          },
          monitoring: {
            metrics: ['hybrid_api_health', 'migration_progress', 'performance_comparison'],
            alerts: ['hybrid_api_failure', 'migration_stalled'],
            healthChecks: ['hybrid_runtime_health', 'database_connectivity']
          }
        },
        
        beta_rollout: {
          id: 'beta_rollout',
          name: 'Beta User Rollout',
          description: 'Gradual rollout to beta users',
          status: 'pending',
          rolloutPercentage: 5,
          prerequisites: ['hybrid_preparation'],
          features: ['progressive_migration', 'admin_hybrid_controls'],
          rollbackPlan: {
            triggers: ['user_complaints', 'high_error_rate', 'performance_issues'],
            steps: ['pause_migration', 'rollback_beta_users', 'investigate_issues'],
            automaticRollback: true
          },
          monitoring: {
            metrics: ['user_satisfaction', 'api_performance', 'error_rates'],
            alerts: ['beta_user_issues', 'performance_regression'],
            healthChecks: ['user_experience_metrics', 'api_stability']
          }
        },
        
        full_migration: {
          id: 'full_migration',
          name: 'Full Migration',
          description: 'Complete migration to hybrid architecture',
          status: 'pending',
          rolloutPercentage: 100,
          prerequisites: ['beta_rollout'],
          features: ['progressive_migration'],
          rollbackPlan: {
            triggers: ['critical_failure', 'data_loss', 'security_breach'],
            steps: ['emergency_rollback', 'restore_github_pages', 'incident_response'],
            automaticRollback: false
          },
          monitoring: {
            metrics: ['system_performance', 'user_adoption', 'cost_efficiency'],
            alerts: ['system_failure', 'performance_degradation', 'cost_overrun'],
            healthChecks: ['full_system_health', 'data_integrity', 'security_status']
          }
        }
      },
      
      userSegments: {
        beta: {
          enabled: false,
          criteria: ['opt_in_beta', 'admin_user', 'developer_mode'],
          percentage: 5
        },
        gradualRollout: {
          enabled: false,
          schedule: [
            { date: '2025-09-01', percentage: 5, segment: 'beta' },
            { date: '2025-09-15', percentage: 25, segment: 'early_adopters' },
            { date: '2025-10-01', percentage: 50, segment: 'general_users' },
            { date: '2025-10-15', percentage: 100, segment: 'all_users' }
          ]
        }
      },
      
      performance: {
        maxResponseTime: 2000,
        maxErrorRate: 0.05,
        minSuccessRate: 0.95,
        rollbackThresholds: {
          errorRate: 0.1,
          responseTime: 5000,
          failureCount: 10
        }
      },
      
      monitoring: {
        enabled: true,
        endpoints: [
          '/health',
          '/api/status',
          '/metrics'
        ],
        alertChannels: [],
        dashboardUrl: undefined
      }
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): MigrationConfig {
    return this.config || this.getDefaultConfig();
  }

  /**
   * Check if a feature is enabled for the current user/environment
   */
  public isFeatureEnabled(featureId: string, userId?: string): boolean {
    const config = this.getConfig();
    const feature = config.features[featureId];
    
    if (!feature || !feature.enabled) {
      return false;
    }
    
    // Check environment
    if (feature.environment !== 'all' && feature.environment !== config.environment) {
      return false;
    }
    
    // Check rollout percentage
    if (feature.rolloutPercentage < 100) {
      const userHash = userId ? this.simpleHash(userId) : Math.random() * 100;
      const userPercentile = Math.abs(userHash) % 100;
      
      if (userPercentile >= feature.rolloutPercentage) {
        return false;
      }
    }
    
    // Check dependencies
    if (feature.dependencies) {
      for (const dep of feature.dependencies) {
        if (!this.isFeatureEnabled(dep, userId)) {
          return false;
        }
      }
    }
    
    // Log feature usage
    this.metricsCollector('feature_flag_checked', {
      featureId,
      enabled: true,
      userId: userId || 'anonymous'
    });
    
    return true;
  }

  /**
   * Get current migration phase
   */
  public getCurrentPhase(): MigrationPhase {
    const config = this.getConfig();
    return config.phases[config.currentPhase] || config.phases.github_pages_stable;
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(listener: (config: MigrationConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current config
    listener(this.getConfig());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    const config = this.getConfig();
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Error in migration config listener:', error);
      }
    });
  }

  /**
   * Update configuration and persist
   */
  public async updateConfig(updates: Partial<MigrationConfig>): Promise<void> {
    const currentConfig = this.getConfig();
    const newConfig = this.deepMerge({ ...currentConfig }, updates);
    
    newConfig.lastUpdated = new Date().toISOString();
    newConfig.version = this.generateConfigVersion(newConfig);
    
    this.config = newConfig;
    
    // Persist to localStorage
    try {
      localStorage.setItem('sciencehabits_migration_config', JSON.stringify(newConfig));
    } catch (error) {
      console.warn('Failed to persist config to localStorage:', error);
    }
    
    this.notifyListeners();
    
    this.metricsCollector('migration_config_updated', {
      version: newConfig.version,
      environment: newConfig.environment
    });
  }

  /**
   * Get API configuration based on current migration state
   */
  public getAPIConfig(): { primary: string; fallbacks: Array<{ url: string; priority: number }> } {
    const config = this.getConfig();
    const apis = Object.entries(config.apis)
      .filter(([_, api]) => api.enabled && api.baseUrl)
      .map(([name, api]) => ({ name, url: api.baseUrl, priority: api.fallbackPriority }))
      .sort((a, b) => a.priority - b.priority);
    
    return {
      primary: apis[0]?.url || config.apis.githubPages.baseUrl,
      fallbacks: apis.slice(1)
    };
  }
}

// Global migration config manager instance
export const migrationConfig = new MigrationConfigManager((event, data) => {
  // Metrics collection will be implemented with performance monitoring
  console.log(`📊 Migration Metric: ${event}`, data);
});