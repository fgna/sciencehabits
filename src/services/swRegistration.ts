/**
 * Service Worker Registration and Management
 * 
 * Handles service worker lifecycle, registration, updates, and communication
 * with the ScienceHabits application for offline functionality.
 */

interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'QUEUE_OFFLINE_OPERATION' | 'TRIGGER_SYNC' | 'CLEAR_CACHE';
  data?: any;
}

interface OfflineOperation {
  type: 'HABIT_COMPLETION' | 'CUSTOM_HABIT' | 'PROGRESS_UPDATE';
  data: any;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  syncInProgress: boolean;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private syncStatusCallbacks: ((status: SyncStatus) => void)[] = [];
  private isOnline: boolean = navigator.onLine;
  private pendingOperations: number = 0;
  private syncInProgress: boolean = false;
  private lastSyncTime: Date | null = null;

  constructor() {
    this.setupOnlineDetection();
    this.setupServiceWorkerMessages();
  }

  /**
   * Register the service worker
   */
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SWM] Service workers not supported');
      return false;
    }

    try {
      console.log('[SWM] Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SWM] Service worker registered:', this.registration.scope);

      // Handle service worker updates
      this.setupUpdateHandling();

      // Setup message communication
      this.setupMessageHandling();

      return true;
    } catch (error) {
      console.error('[SWM] Service worker registration failed:', error);
      return false;
    }
  }

  /**
   * Setup service worker update handling
   */
  private setupUpdateHandling(): void {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      console.log('[SWM] New service worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker is available
            console.log('[SWM] New service worker available');
            this.notifyUpdateAvailable();
          } else {
            // Service worker is controlling the page for the first time
            console.log('[SWM] Service worker is now controlling the page');
          }
        }
      });
    });
  }

  /**
   * Setup message handling between service worker and main thread
   */
  private setupMessageHandling(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'SYNC_COMPLETE':
          this.handleSyncComplete(data);
          break;

        case 'CACHE_UPDATE':
          this.handleCacheUpdate(data);
          break;

        case 'OFFLINE_OPERATION_QUEUED':
          this.handleOperationQueued(data);
          break;

        default:
          console.log('[SWM] Unknown message from service worker:', type);
      }
    });
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      console.log('[SWM] Connection restored');
      this.isOnline = true;
      this.notifySyncStatus();
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      console.log('[SWM] Connection lost');
      this.isOnline = false;
      this.notifySyncStatus();
    });
  }

  /**
   * Setup service worker message listening
   */
  private setupServiceWorkerMessages(): void {
    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SWM] Message from service worker:', event.data);
    });
  }

  /**
   * Send message to service worker
   */
  private async sendMessage(message: ServiceWorkerMessage): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      console.warn('[SWM] No service worker controller available');
      return;
    }

    try {
      navigator.serviceWorker.controller.postMessage(message);
    } catch (error) {
      console.error('[SWM] Failed to send message to service worker:', error);
    }
  }

  /**
   * Queue offline operation for background sync
   */
  async queueOfflineOperation(operation: OfflineOperation): Promise<void> {
    try {
      await this.sendMessage({
        type: 'QUEUE_OFFLINE_OPERATION',
        data: operation
      });

      this.pendingOperations++;
      this.notifySyncStatus();

      console.log('[SWM] Queued offline operation:', operation.type);
    } catch (error) {
      console.error('[SWM] Failed to queue offline operation:', error);
      throw error;
    }
  }

  /**
   * Trigger background sync
   */
  async triggerSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SWM] Cannot trigger sync while offline');
      return;
    }

    if (this.syncInProgress) {
      console.log('[SWM] Sync already in progress');
      return;
    }

    try {
      this.syncInProgress = true;
      this.notifySyncStatus();

      await this.sendMessage({ type: 'TRIGGER_SYNC' });
      console.log('[SWM] Background sync triggered');
    } catch (error) {
      console.error('[SWM] Failed to trigger sync:', error);
      this.syncInProgress = false;
      this.notifySyncStatus();
    }
  }

  /**
   * Handle sync completion message from service worker
   */
  private handleSyncComplete(data: { processed: number; failed: number }): void {
    console.log('[SWM] Sync completed:', data);
    
    this.syncInProgress = false;
    this.pendingOperations = Math.max(0, this.pendingOperations - data.processed);
    this.lastSyncTime = new Date();
    
    this.notifySyncStatus();

    // Show user notification if there were sync issues
    if (data.failed > 0) {
      this.notifySyncError(data.failed);
    }
  }

  /**
   * Handle cache update message from service worker
   */
  private handleCacheUpdate(data: any): void {
    console.log('[SWM] Cache updated:', data);
    // Could trigger UI refresh here if needed
  }

  /**
   * Handle operation queued message from service worker
   */
  private handleOperationQueued(data: any): void {
    console.log('[SWM] Operation queued by service worker:', data);
    this.pendingOperations++;
    this.notifySyncStatus();
  }

  /**
   * Clear specific cache
   */
  async clearCache(cacheName: string): Promise<void> {
    try {
      await this.sendMessage({
        type: 'CLEAR_CACHE',
        data: { cacheName }
      });
      console.log('[SWM] Cache clear requested:', cacheName);
    } catch (error) {
      console.error('[SWM] Failed to clear cache:', error);
    }
  }

  /**
   * Update service worker to latest version
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      console.warn('[SWM] No registration available for update');
      return;
    }

    try {
      await this.registration.update();
      
      if (this.registration.waiting) {
        await this.sendMessage({ type: 'SKIP_WAITING' });
      }
      
      console.log('[SWM] Service worker update initiated');
    } catch (error) {
      console.error('[SWM] Service worker update failed:', error);
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingOperations: this.pendingOperations,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncStatusCallbacks.push(callback);
    
    // Immediately call with current status
    callback(this.getSyncStatus());
    
    // Return unsubscribe function
    return () => {
      const index = this.syncStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncStatusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of sync status changes
   */
  private notifySyncStatus(): void {
    const status = this.getSyncStatus();
    this.syncStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[SWM] Sync status callback error:', error);
      }
    });
  }

  /**
   * Notify user about service worker update
   */
  private notifyUpdateAvailable(): void {
    // Could show a toast notification or banner
    const event = new CustomEvent('sw-update-available', {
      detail: { updateAvailable: true }
    });
    window.dispatchEvent(event);
  }

  /**
   * Notify user about sync errors
   */
  private notifySyncError(failedCount: number): void {
    const event = new CustomEvent('sw-sync-error', {
      detail: { failedOperations: failedCount }
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if service worker is supported and active
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return !this.isOnline;
  }

  /**
   * Get registration details
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Export types for use in other modules
export type { OfflineOperation, SyncStatus };

/**
 * Convenience functions for common operations
 */

/**
 * Initialize service worker (call this in your app's entry point)
 */
export async function initializeServiceWorker(): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SWM] Service worker disabled in development mode');
    return false;
  }

  return await serviceWorkerManager.register();
}

/**
 * Queue habit completion for offline sync
 */
export async function queueHabitCompletion(
  userId: string,
  habitId: string,
  date: string
): Promise<void> {
  await serviceWorkerManager.queueOfflineOperation({
    type: 'HABIT_COMPLETION',
    data: { userId, habitId, date }
  });
}

/**
 * Queue custom habit creation for offline sync
 */
export async function queueCustomHabit(habitData: any): Promise<void> {
  await serviceWorkerManager.queueOfflineOperation({
    type: 'CUSTOM_HABIT',
    data: habitData
  });
}

/**
 * Queue progress update for offline sync
 */
export async function queueProgressUpdate(progressData: any): Promise<void> {
  await serviceWorkerManager.queueOfflineOperation({
    type: 'PROGRESS_UPDATE',
    data: progressData
  });
}

/**
 * Trigger manual sync (useful for user-initiated sync)
 */
export async function triggerManualSync(): Promise<void> {
  await serviceWorkerManager.triggerSync();
}

/**
 * Get current online/offline status
 */
export function getConnectionStatus(): { isOnline: boolean; lastSyncTime: Date | null } {
  const status = serviceWorkerManager.getSyncStatus();
  return {
    isOnline: status.isOnline,
    lastSyncTime: status.lastSyncTime
  };
}

/**
 * Subscribe to connection status changes
 */
export function onConnectionStatusChange(
  callback: (status: SyncStatus) => void
): () => void {
  return serviceWorkerManager.onSyncStatusChange(callback);
}