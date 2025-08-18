/**
 * Service Worker Sync Integration
 * 
 * Coordinates service worker offline capabilities with existing cloud sync services.
 * Handles background sync, queue processing, and cloud provider integration.
 */

import { serviceWorkerManager, type OfflineOperation } from './swRegistration';
import { offlineQueueManager } from './offlineQueue';
import { dbHelpers } from './storage/database';
// Cloud sync services removed for MVP
// MVP: Disabled cloud sync imports
// import { HabitSyncService } from './habitSyncService';
// import { GoogleDriveService } from './googleDriveService';

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

interface CloudSyncConfig {
  provider: 'google-drive' | 'nextcloud' | 'none';
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
}

class ServiceWorkerSyncManager {
  private cloudConfig: CloudSyncConfig = {
    provider: 'none',
    enabled: false,
    autoSync: false,
    syncInterval: 5
  };

  private syncInProgress: boolean = false;
  private lastSyncTime: Date | null = null;
  private syncCallbacks: ((result: SyncResult) => void)[] = [];

  constructor() {
    this.loadCloudConfig();
    this.setupEventListeners();
  }

  /**
   * Initialize service worker sync integration
   */
  async initialize(): Promise<void> {
    try {
      // Initialize offline queue
      await offlineQueueManager.initialize();

      // Setup service worker message handling
      this.setupServiceWorkerMessages();

      // Start auto-sync if enabled
      if (this.cloudConfig.enabled && this.cloudConfig.autoSync) {
        this.startAutoSync();
      }

      console.log('[SWSync] Service worker sync integration initialized');
    } catch (error) {
      console.error('[SWSync] Failed to initialize:', error);
    }
  }

  /**
   * Setup service worker message handling
   */
  private setupServiceWorkerMessages(): void {
    // Listen for service worker sync events
    serviceWorkerManager.onSyncStatusChange((status) => {
      if (status.isOnline && !this.syncInProgress && status.pendingOperations > 0) {
        this.processPendingOperations();
      }
    });

    // Listen for custom sync events
    window.addEventListener('sw-sync-complete', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.handleSyncComplete(customEvent.detail);
    });

    window.addEventListener('sw-sync-error', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.handleSyncError(customEvent.detail);
    });
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('[SWSync] Connection restored, processing pending operations');
      this.processPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('[SWSync] Connection lost, operations will be queued');
    });
  }

  /**
   * Load cloud sync configuration
   */
  private loadCloudConfig(): void {
    try {
      const stored = localStorage.getItem('sciencehabits_cloud_config');
      if (stored) {
        this.cloudConfig = { ...this.cloudConfig, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[SWSync] Failed to load cloud config:', error);
    }
  }

  /**
   * Save cloud sync configuration
   */
  private saveCloudConfig(): void {
    try {
      localStorage.setItem('sciencehabits_cloud_config', JSON.stringify(this.cloudConfig));
    } catch (error) {
      console.error('[SWSync] Failed to save cloud config:', error);
    }
  }

  /**
   * Configure cloud sync provider
   */
  async configureCloudSync(config: Partial<CloudSyncConfig>): Promise<void> {
    this.cloudConfig = { ...this.cloudConfig, ...config };
    this.saveCloudConfig();

    if (config.enabled && config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }

    console.log('[SWSync] Cloud sync configured:', this.cloudConfig);
  }

  /**
   * Queue offline operation through service worker
   */
  async queueOfflineOperation(operation: OfflineOperation): Promise<void> {
    try {
      // Add to local offline queue
      await offlineQueueManager.queueOperation({
        type: operation.type,
        data: operation.data,
        priority: this.getPriorityForOperation(operation.type),
        userId: operation.data.userId
      });

      // Notify service worker
      await serviceWorkerManager.queueOfflineOperation(operation);

      console.log('[SWSync] Queued offline operation:', operation.type);
    } catch (error) {
      console.error('[SWSync] Failed to queue offline operation:', error);
      throw error;
    }
  }

  /**
   * Process pending offline operations
   */
  async processPendingOperations(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('[SWSync] Sync already in progress');
      return { success: false, processed: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    try {
      this.syncInProgress = true;
      console.log('[SWSync] Processing pending operations...');

      const pendingOperations = await offlineQueueManager.getAllQueuedOperations();
      
      if (pendingOperations.length === 0) {
        console.log('[SWSync] No pending operations to process');
        return { success: true, processed: 0, failed: 0, errors: [] };
      }

      const result = await this.processOperationBatch(pendingOperations);
      
      // Update sync status
      this.lastSyncTime = new Date();
      
      // Notify listeners
      this.notifySyncComplete(result);

      console.log(`[SWSync] Sync completed: ${result.processed} processed, ${result.failed} failed`);
      
      return result;
    } catch (error) {
      console.error('[SWSync] Failed to process pending operations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result = { success: false, processed: 0, failed: 0, errors: [errorMessage] };
      this.notifySyncComplete(result);
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process batch of operations
   */
  private async processOperationBatch(operations: any[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    const priorityOperations = operations.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    for (const operation of priorityOperations) {
      try {
        await this.processOperation(operation);
        await offlineQueueManager.removeOperation(operation.id);
        result.processed++;
      } catch (error) {
        console.error('[SWSync] Failed to process operation:', operation.id, error);
        
        // Update retry count
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await offlineQueueManager.updateOperationRetry(operation.id, errorMessage);
        
        result.failed++;
        result.errors.push(`Operation ${operation.id}: ${errorMessage}`);
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  /**
   * Process individual operation
   */
  private async processOperation(operation: any): Promise<void> {
    switch (operation.type) {
      case 'HABIT_COMPLETION':
        await this.syncHabitCompletion(operation.data);
        break;

      case 'CUSTOM_HABIT':
        await this.syncCustomHabit(operation.data);
        break;

      case 'PROGRESS_UPDATE':
        await this.syncProgressUpdate(operation.data);
        break;

      case 'HABIT_DELETION':
        await this.syncHabitDeletion(operation.data);
        break;

      case 'USER_UPDATE':
        await this.syncUserUpdate(operation.data);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Sync habit completion to cloud
   */
  private async syncHabitCompletion(data: any): Promise<void> {
    // First update local database
    await dbHelpers.markHabitComplete(data.userId, data.habitId, data.date);

    // Then sync to cloud if enabled
    if (this.cloudConfig.enabled) {
      await this.syncToCloud();
    }
  }

  /**
   * Sync custom habit to cloud
   */
  private async syncCustomHabit(data: any): Promise<void> {
    // Create habit locally
    await dbHelpers.createCustomHabit(data);

    // Sync to cloud if enabled
    if (this.cloudConfig.enabled) {
      await this.syncToCloud();
    }
  }

  /**
   * Sync progress update to cloud
   */
  private async syncProgressUpdate(data: any): Promise<void> {
    // Update local progress (implementation depends on data structure)
    console.log('[SWSync] Syncing progress update:', data);

    // Sync to cloud if enabled
    if (this.cloudConfig.enabled) {
      await this.syncToCloud();
    }
  }

  /**
   * Sync habit deletion to cloud
   */
  private async syncHabitDeletion(data: any): Promise<void> {
    // Delete locally
    await dbHelpers.deleteHabit(data.habitId);
    await dbHelpers.deleteProgress(data.userId, data.habitId);

    // Sync to cloud if enabled
    if (this.cloudConfig.enabled) {
      await this.syncToCloud();
    }
  }

  /**
   * Sync user update to cloud
   */
  private async syncUserUpdate(data: any): Promise<void> {
    // Update user locally
    await dbHelpers.updateUser(data.userId, data);

    // Sync to cloud if enabled
    if (this.cloudConfig.enabled) {
      await this.syncToCloud();
    }
  }

  /**
   * Sync all data to cloud provider
   */
  private async syncToCloud(): Promise<void> {
    if (!this.cloudConfig.enabled) return;

    try {
      // MVP: Cloud sync services removed - local sync only
      console.log('[SWSync] Cloud sync disabled for MVP - data synced locally only');
      return;
    } catch (error) {
      console.error('[SWSync] Cloud sync failed:', error);
      throw error;
    }
  }

  /**
   * Get priority for operation type
   */
  private getPriorityForOperation(type: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'HABIT_COMPLETION':
        return 'high';
      case 'CUSTOM_HABIT':
        return 'medium';
      case 'PROGRESS_UPDATE':
        return 'medium';
      case 'HABIT_DELETION':
        return 'high';
      case 'USER_UPDATE':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Start automatic sync
   */
  private startAutoSync(): void {
    this.stopAutoSync(); // Clear any existing interval

    const intervalMs = this.cloudConfig.syncInterval * 60 * 1000;
    setInterval(() => {
      if (serviceWorkerManager.getSyncStatus().isOnline) {
        this.processPendingOperations();
      }
    }, intervalMs);

    console.log(`[SWSync] Auto-sync started (${this.cloudConfig.syncInterval} minutes)`);
  }

  /**
   * Stop automatic sync
   */
  private stopAutoSync(): void {
    // Implementation would clear the interval if we stored the reference
    console.log('[SWSync] Auto-sync stopped');
  }

  /**
   * Handle sync completion from service worker
   */
  private handleSyncComplete(data: any): void {
    console.log('[SWSync] Service worker sync completed:', data);
  }

  /**
   * Handle sync error from service worker
   */
  private handleSyncError(data: any): void {
    console.error('[SWSync] Service worker sync error:', data);
  }

  /**
   * Notify sync completion listeners
   */
  private notifySyncComplete(result: SyncResult): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('[SWSync] Sync callback error:', error);
      }
    });
  }

  /**
   * Subscribe to sync completion events
   */
  onSyncComplete(callback: (result: SyncResult) => void): () => void {
    this.syncCallbacks.push(callback);
    
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    cloudConfig: CloudSyncConfig;
    lastSyncTime: Date | null;
    syncInProgress: boolean;
    pendingOperations: number;
  } {
    return {
      cloudConfig: this.cloudConfig,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      pendingOperations: 0 // Would need to get from queue
    };
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(): Promise<SyncResult> {
    return await this.processPendingOperations();
  }

  /**
   * Clear all pending operations
   */
  async clearPendingOperations(): Promise<void> {
    await offlineQueueManager.clearAll();
    console.log('[SWSync] Cleared all pending operations');
  }
}

// Create singleton instance
export const serviceWorkerSync = new ServiceWorkerSyncManager();

// Export types for use in other modules
export type { SyncResult, CloudSyncConfig };

/**
 * Convenience functions for common operations
 */

/**
 * Initialize service worker sync (call this in your app's entry point)
 */
export async function initializeServiceWorkerSync(): Promise<void> {
  await serviceWorkerSync.initialize();
}

/**
 * Queue habit completion with offline support
 */
export async function queueHabitCompletionSync(
  userId: string,
  habitId: string,
  date: string
): Promise<void> {
  await serviceWorkerSync.queueOfflineOperation({
    type: 'HABIT_COMPLETION',
    data: { userId, habitId, date }
  });
}

/**
 * Configure cloud sync settings
 */
export async function configureCloudSync(config: Partial<CloudSyncConfig>): Promise<void> {
  await serviceWorkerSync.configureCloudSync(config);
}

/**
 * Trigger manual sync
 */
export async function triggerManualSync(): Promise<SyncResult> {
  return await serviceWorkerSync.triggerManualSync();
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
  return serviceWorkerSync.getSyncStatus();
}

/**
 * Subscribe to sync events
 */
export function onSyncComplete(callback: (result: SyncResult) => void): () => void {
  return serviceWorkerSync.onSyncComplete(callback);
}