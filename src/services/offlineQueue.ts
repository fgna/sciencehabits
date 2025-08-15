/**
 * Offline Queue Management Service
 * 
 * Manages offline operations queue in IndexedDB for the ScienceHabits app.
 * Ensures habit tracking data integrity during offline periods.
 */

import { db } from './storage/database';

export interface OfflineQueueItem {
  id: string;
  type: 'HABIT_COMPLETION' | 'CUSTOM_HABIT' | 'PROGRESS_UPDATE' | 'HABIT_DELETION' | 'USER_UPDATE';
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  lastError?: string;
}

export interface QueueStats {
  totalItems: number;
  itemsByType: Record<string, number>;
  itemsByPriority: Record<string, number>;
  oldestItem: Date | null;
  averageRetryCount: number;
}

class OfflineQueueManager {
  private readonly MAX_RETRY_COUNT = 5;
  private readonly BATCH_SIZE = 10;
  private readonly MAX_QUEUE_SIZE = 1000;

  /**
   * Initialize offline queue table in IndexedDB
   */
  async initialize(): Promise<void> {
    try {
      // Check if the offlineQueue table exists
      const tableExists = db.tables.some(table => table.name === 'offlineQueue');
      
      if (!tableExists) {
        console.log('[OfflineQueue] Creating offline queue table...');
        // Add the offline queue table to the database schema
        await this.createOfflineQueueTable();
      }
      
      console.log('[OfflineQueue] Offline queue initialized');
    } catch (error) {
      console.error('[OfflineQueue] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Create offline queue table
   */
  private async createOfflineQueueTable(): Promise<void> {
    // Close current database connection
    db.close();
    
    // Reopen with new schema version
    const newDb = new (db.constructor as any)();
    newDb.version(db.verno + 1).stores({
      users: 'id, name, createdAt, language, lifestyle, preferredTime, dailyMinutes',
      habits: 'id, category, isCustom, difficulty, effectivenessScore, evidenceStrength, frequency.type, *goalTags, *lifestyleTags, *timeTags',
      progress: 'id, userId, habitId, dateStarted, currentStreak, longestStreak, lastCompletionDate, *completions',
      research: 'id, category, year, studyType, sampleSize, evidenceLevel, studyQuality, *habitRelevance',
      offlineQueue: 'id, type, timestamp, priority, userId, retryCount'
    });
    
    await newDb.open();
  }

  /**
   * Add operation to offline queue
   */
  async queueOperation(operation: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      // Check queue size limit
      const queueSize = await this.getQueueSize();
      if (queueSize >= this.MAX_QUEUE_SIZE) {
        await this.cleanupOldItems();
      }

      const queueItem: OfflineQueueItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        retryCount: 0,
        ...operation
      };

      // Store in IndexedDB
      await this.storeQueueItem(queueItem);

      console.log(`[OfflineQueue] Queued ${operation.type} operation:`, queueItem.id);
      return queueItem.id;
    } catch (error) {
      console.error('[OfflineQueue] Failed to queue operation:', error);
      throw error;
    }
  }

  /**
   * Store queue item in IndexedDB
   */
  private async storeQueueItem(item: OfflineQueueItem): Promise<void> {
    try {
      // Check if offlineQueue table exists
      if (!db.tables.some(table => table.name === 'offlineQueue')) {
        // Fallback: store in localStorage if IndexedDB table doesn't exist
        const existing = this.getLocalStorageQueue();
        existing.push(item);
        localStorage.setItem('sciencehabits_offline_queue', JSON.stringify(existing));
        return;
      }

      await db.table('offlineQueue').add(item);
    } catch (error) {
      console.error('[OfflineQueue] Failed to store item in IndexedDB, using localStorage fallback:', error);
      
      // Fallback to localStorage
      const existing = this.getLocalStorageQueue();
      existing.push(item);
      localStorage.setItem('sciencehabits_offline_queue', JSON.stringify(existing));
    }
  }

  /**
   * Get queue from localStorage (fallback)
   */
  private getLocalStorageQueue(): OfflineQueueItem[] {
    try {
      const stored = localStorage.getItem('sciencehabits_offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[OfflineQueue] Failed to read localStorage queue:', error);
      return [];
    }
  }

  /**
   * Get all queued operations
   */
  async getAllQueuedOperations(): Promise<OfflineQueueItem[]> {
    try {
      // Try IndexedDB first
      if (db.tables.some(table => table.name === 'offlineQueue')) {
        return await db.table('offlineQueue').orderBy('timestamp').toArray();
      }
      
      // Fallback to localStorage
      return this.getLocalStorageQueue();
    } catch (error) {
      console.error('[OfflineQueue] Failed to get queued operations:', error);
      return this.getLocalStorageQueue();
    }
  }

  /**
   * Get queued operations by priority
   */
  async getQueuedOperationsByPriority(): Promise<OfflineQueueItem[]> {
    const allOperations = await this.getAllQueuedOperations();
    
    // Sort by priority and timestamp
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return allOperations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Remove operation from queue
   */
  async removeOperation(operationId: string): Promise<void> {
    try {
      // Try IndexedDB first
      if (db.tables.some(table => table.name === 'offlineQueue')) {
        await db.table('offlineQueue').delete(operationId);
      } else {
        // Fallback to localStorage
        const existing = this.getLocalStorageQueue();
        const filtered = existing.filter(item => item.id !== operationId);
        localStorage.setItem('sciencehabits_offline_queue', JSON.stringify(filtered));
      }
      
      console.log('[OfflineQueue] Removed operation:', operationId);
    } catch (error) {
      console.error('[OfflineQueue] Failed to remove operation:', error);
    }
  }

  /**
   * Update operation retry count and error
   */
  async updateOperationRetry(operationId: string, error?: string): Promise<void> {
    try {
      const operation = await this.getOperation(operationId);
      if (!operation) return;

      operation.retryCount++;
      operation.lastError = error;

      // If exceeded max retries, remove from queue
      if (operation.retryCount >= this.MAX_RETRY_COUNT) {
        console.warn(`[OfflineQueue] Operation ${operationId} exceeded max retries, removing`);
        await this.removeOperation(operationId);
        return;
      }

      // Update the operation
      if (db.tables.some(table => table.name === 'offlineQueue')) {
        await db.table('offlineQueue').update(operationId, {
          retryCount: operation.retryCount,
          lastError: operation.lastError
        });
      } else {
        // Fallback to localStorage
        const existing = this.getLocalStorageQueue();
        const index = existing.findIndex(item => item.id === operationId);
        if (index >= 0) {
          existing[index] = operation;
          localStorage.setItem('sciencehabits_offline_queue', JSON.stringify(existing));
        }
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to update operation retry:', error);
    }
  }

  /**
   * Get specific operation
   */
  async getOperation(operationId: string): Promise<OfflineQueueItem | undefined> {
    try {
      if (db.tables.some(table => table.name === 'offlineQueue')) {
        return await db.table('offlineQueue').get(operationId);
      } else {
        const existing = this.getLocalStorageQueue();
        return existing.find(item => item.id === operationId);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to get operation:', error);
      return undefined;
    }
  }

  /**
   * Get operations for specific user
   */
  async getUserOperations(userId: string): Promise<OfflineQueueItem[]> {
    const allOperations = await this.getAllQueuedOperations();
    return allOperations.filter(op => op.userId === userId);
  }

  /**
   * Get operations by type
   */
  async getOperationsByType(type: OfflineQueueItem['type']): Promise<OfflineQueueItem[]> {
    const allOperations = await this.getAllQueuedOperations();
    return allOperations.filter(op => op.type === type);
  }

  /**
   * Clear all operations for a user
   */
  async clearUserOperations(userId: string): Promise<void> {
    try {
      const userOperations = await this.getUserOperations(userId);
      
      for (const operation of userOperations) {
        await this.removeOperation(operation.id);
      }
      
      console.log(`[OfflineQueue] Cleared ${userOperations.length} operations for user ${userId}`);
    } catch (error) {
      console.error('[OfflineQueue] Failed to clear user operations:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const operations = await this.getAllQueuedOperations();
      
      const stats: QueueStats = {
        totalItems: operations.length,
        itemsByType: {},
        itemsByPriority: {},
        oldestItem: null,
        averageRetryCount: 0
      };

      if (operations.length === 0) return stats;

      // Calculate statistics
      operations.forEach(op => {
        stats.itemsByType[op.type] = (stats.itemsByType[op.type] || 0) + 1;
        stats.itemsByPriority[op.priority] = (stats.itemsByPriority[op.priority] || 0) + 1;
      });

      stats.oldestItem = new Date(Math.min(...operations.map(op => op.timestamp)));
      stats.averageRetryCount = operations.reduce((sum, op) => sum + op.retryCount, 0) / operations.length;

      return stats;
    } catch (error) {
      console.error('[OfflineQueue] Failed to get queue stats:', error);
      return {
        totalItems: 0,
        itemsByType: {},
        itemsByPriority: {},
        oldestItem: null,
        averageRetryCount: 0
      };
    }
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    try {
      if (db.tables.some(table => table.name === 'offlineQueue')) {
        return await db.table('offlineQueue').count();
      } else {
        return this.getLocalStorageQueue().length;
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to get queue size:', error);
      return 0;
    }
  }

  /**
   * Cleanup old items to prevent queue overflow
   */
  async cleanupOldItems(): Promise<void> {
    try {
      const operations = await this.getAllQueuedOperations();
      
      // Remove items older than 7 days or with too many retries
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      const itemsToRemove = operations.filter(op => 
        op.timestamp < cutoffTime || op.retryCount >= this.MAX_RETRY_COUNT
      );

      for (const item of itemsToRemove) {
        await this.removeOperation(item.id);
      }

      console.log(`[OfflineQueue] Cleaned up ${itemsToRemove.length} old items`);
    } catch (error) {
      console.error('[OfflineQueue] Failed to cleanup old items:', error);
    }
  }

  /**
   * Clear all queued operations
   */
  async clearAll(): Promise<void> {
    try {
      if (db.tables.some(table => table.name === 'offlineQueue')) {
        await db.table('offlineQueue').clear();
      }
      
      localStorage.removeItem('sciencehabits_offline_queue');
      console.log('[OfflineQueue] Cleared all queued operations');
    } catch (error) {
      console.error('[OfflineQueue] Failed to clear all operations:', error);
    }
  }

  /**
   * Export queue for debugging
   */
  async exportQueue(): Promise<OfflineQueueItem[]> {
    return await this.getAllQueuedOperations();
  }
}

// Create singleton instance
export const offlineQueueManager = new OfflineQueueManager();

/**
 * Convenience functions for common queue operations
 */

/**
 * Queue habit completion for offline sync
 */
export async function queueHabitCompletion(
  userId: string,
  habitId: string,
  date: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'high'
): Promise<string> {
  return await offlineQueueManager.queueOperation({
    type: 'HABIT_COMPLETION',
    data: { userId, habitId, date },
    priority,
    userId
  });
}

/**
 * Queue custom habit creation
 */
export async function queueCustomHabit(
  userId: string,
  habitData: any,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string> {
  return await offlineQueueManager.queueOperation({
    type: 'CUSTOM_HABIT',
    data: habitData,
    priority,
    userId
  });
}

/**
 * Queue progress update
 */
export async function queueProgressUpdate(
  userId: string,
  progressData: any,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string> {
  return await offlineQueueManager.queueOperation({
    type: 'PROGRESS_UPDATE',
    data: progressData,
    priority,
    userId
  });
}

/**
 * Queue habit deletion
 */
export async function queueHabitDeletion(
  userId: string,
  habitId: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string> {
  return await offlineQueueManager.queueOperation({
    type: 'HABIT_DELETION',
    data: { userId, habitId },
    priority,
    userId
  });
}

/**
 * Queue user profile update
 */
export async function queueUserUpdate(
  userId: string,
  userData: any,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<string> {
  return await offlineQueueManager.queueOperation({
    type: 'USER_UPDATE',
    data: userData,
    priority,
    userId
  });
}

/**
 * Initialize offline queue (call this during app startup)
 */
export async function initializeOfflineQueue(): Promise<void> {
  await offlineQueueManager.initialize();
}

/**
 * Get queue statistics for debugging/monitoring
 */
export async function getOfflineQueueStats(): Promise<QueueStats> {
  return await offlineQueueManager.getQueueStats();
}