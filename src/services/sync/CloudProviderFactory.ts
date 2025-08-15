/**
 * Cloud Provider Factory
 * 
 * Creates and manages instances of different cloud storage providers
 * based on user configuration and preferences.
 */

import { CloudProvider, CloudConfig, CloudProviderType } from '../../types/sync';
import { NextCloudProvider } from './NextCloudProvider';
import { GoogleCloudProvider } from './GoogleCloudProvider';
import { GoogleDriveProvider } from './GoogleDriveProvider';

export class CloudProviderFactory {
  private static instances = new Map<string, CloudProvider>();

  /**
   * Create a cloud provider instance based on configuration
   */
  static create(config: CloudConfig): CloudProvider {
    this.validateConfig(config);
    
    const key = this.generateConfigKey(config);
    
    // Return existing instance if available
    if (this.instances.has(key)) {
      const existing = this.instances.get(key)!;
      console.log(`♻️ Reusing existing ${config.type} provider`);
      return existing;
    }
    
    // Create new provider instance
    let provider: CloudProvider;
    
    switch (config.type) {
      case 'nextcloud':
        if (!this.isNextCloudConfig(config)) {
          throw new Error('Invalid NextCloud configuration');
        }
        provider = new NextCloudProvider(config);
        break;
        
      case 'google-cloud':
        if (!this.isGoogleCloudConfig(config)) {
          throw new Error('Invalid Google Cloud configuration');
        }
        provider = new GoogleCloudProvider(config);
        break;
        
      case 'google-drive':
        provider = new GoogleDriveProvider(config);
        break;
        
      case 'none':
        throw new Error('Cannot create provider for type "none"');
        
      default:
        throw new Error(`Unsupported provider type: ${(config as any).type}`);
    }
    
    // Cache the instance
    this.instances.set(key, provider);
    console.log(`✅ Created new ${config.type} provider`);
    
    return provider;
  }

  /**
   * Test connection to a provider without caching
   */
  static async testConnection(config: CloudConfig): Promise<{
    success: boolean;
    error?: string;
    latency?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const provider = this.create(config);
      const canConnect = await provider.checkConnection();
      const latency = Date.now() - startTime;
      
      if (canConnect) {
        return { success: true, latency };
      } else {
        return { success: false, error: 'Connection failed' };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        latency 
      };
    }
  }

  /**
   * Test authentication for a provider
   */
  static async testAuthentication(config: CloudConfig): Promise<{
    success: boolean;
    error?: string;
    quota?: { used: number; available: number | null; percentage: number | null };
  }> {
    try {
      const provider = this.create(config);
      
      const canAuth = await provider.authenticate();
      if (!canAuth) {
        return { success: false, error: 'Authentication failed' };
      }
      
      // Get quota information if authentication succeeds
      try {
        const quota = await provider.getStorageQuota();
        return { success: true, quota };
      } catch (quotaError) {
        // Authentication succeeded but quota check failed - that's okay
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * Clear cached provider instance
   */
  static clearCache(config: CloudConfig): void {
    const key = this.generateConfigKey(config);
    if (this.instances.has(key)) {
      this.instances.delete(key);
      console.log(`🗑️ Cleared cached ${config.type} provider`);
    }
  }

  /**
   * Clear all cached providers
   */
  static clearAllCaches(): void {
    const count = this.instances.size;
    this.instances.clear();
    console.log(`🗑️ Cleared ${count} cached providers`);
  }

  /**
   * Get supported provider types with descriptions
   */
  static getSupportedProviders(): Array<{
    type: CloudProviderType;
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    setup: 'easy' | 'moderate' | 'advanced';
  }> {
    return [
      {
        type: 'nextcloud',
        name: 'NextCloud',
        description: 'Self-hosted or managed NextCloud instance',
        pros: [
          'Complete data control and privacy',
          'Can be hosted in EU for GDPR compliance',
          'Open source and transparent',
          'No vendor lock-in'
        ],
        cons: [
          'Requires server setup or managed service',
          'More technical configuration needed',
          'Performance depends on server location'
        ],
        setup: 'moderate'
      },
      {
        type: 'google-cloud',
        name: 'Google Cloud Storage',
        description: 'Use your existing Google Cloud project',
        pros: [
          'High reliability and performance',
          'Global availability and fast sync',
          'Use existing Google Cloud infrastructure',
          'Automatic scaling and management'
        ],
        cons: [
          'Requires existing Google Cloud project',
          'Google processes metadata (encrypted data only)',
          'Billing through Google Cloud account'
        ],
        setup: 'easy'
      }
    ];
  }

  private static validateConfig(config: CloudConfig): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration is required');
    }
    
    if (!config.type || !['nextcloud', 'google-cloud', 'google-drive', 'none'].includes(config.type)) {
      throw new Error(`Invalid provider type: ${config.type}`);
    }
    
    if (config.type === 'nextcloud') {
      const nc = config as any;
      if (!nc.serverUrl || !nc.username || !nc.appPassword) {
        throw new Error('NextCloud configuration requires serverUrl, username, and appPassword');
      }
      
      try {
        new URL(nc.serverUrl);
      } catch {
        throw new Error('Invalid NextCloud server URL');
      }
    }
    
    if (config.type === 'google-cloud') {
      const gc = config as any;
      if (!gc.projectId || !gc.bucketName || !gc.region) {
        throw new Error('Google Cloud configuration requires projectId, bucketName, and region');
      }
      
      if (!gc.credentials || !gc.credentials.type) {
        throw new Error('Google Cloud configuration requires credentials');
      }
    }
  }

  private static generateConfigKey(config: CloudConfig): string {
    switch (config.type) {
      case 'nextcloud':
        const nc = config as any;
        return `nextcloud:${nc.serverUrl}:${nc.username}`;
        
      case 'google-cloud':
        const gc = config as any;
        return `google-cloud:${gc.projectId}:${gc.bucketName}`;
        
      case 'google-drive':
        return 'google-drive:default';
        
      default:
        return `${config.type}:default`;
    }
  }

  private static isNextCloudConfig(config: CloudConfig): config is import('../../types/sync').NextCloudConfig {
    return config.type === 'nextcloud' && 
           'serverUrl' in config && 
           'username' in config && 
           'appPassword' in config;
  }

  private static isGoogleCloudConfig(config: CloudConfig): config is import('../../types/sync').GoogleCloudConfig {
    return config.type === 'google-cloud' && 
           'projectId' in config && 
           'bucketName' in config && 
           'credentials' in config;
  }
}