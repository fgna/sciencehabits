/**
 * Habit Sync Service
 * 
 * Handles syncing habit data between local storage and Google Drive.
 * Provides automatic backup and restore functionality.
 */

import { GoogleDriveService } from './googleDriveService';

export interface SyncStatus {
  isEnabled: boolean;
  lastSync: Date | null;
  provider: 'google-drive' | null;
  error: string | null;
}

export interface HabitBackup {
  version: string;
  timestamp: string;
  habits: any[];
  userSettings: any;
  analytics: any;
}

export class HabitSyncService {
  private static readonly BACKUP_FILE_NAME = 'habits-backup.json';
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize sync service
   */
  static initialize(): void {
    const syncStatus = this.getSyncStatus();
    
    if (syncStatus.isEnabled && syncStatus.provider === 'google-drive') {
      if (GoogleDriveService.isAuthenticated()) {
        console.log('🔄 Starting automatic sync...');
        this.startAutoSync();
      } else {
        console.log('⚠️ Sync enabled but not authenticated, disabling auto-sync');
        this.disableSync();
      }
    }
  }

  /**
   * Enable sync with Google Drive
   */
  static async enableGoogleDriveSync(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!GoogleDriveService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated with Google Drive' };
      }

      // Test connection
      const testResult = await GoogleDriveService.testConnection();
      if (!testResult.success) {
        return { success: false, error: testResult.error };
      }

      // Perform initial sync
      const syncResult = await this.syncToCloud();
      if (!syncResult.success) {
        return { success: false, error: syncResult.error };
      }

      // Update sync status
      const syncStatus: SyncStatus = {
        isEnabled: true,
        lastSync: new Date(),
        provider: 'google-drive',
        error: null
      };
      
      localStorage.setItem('sync_status', JSON.stringify(syncStatus));
      
      // Start automatic sync
      this.startAutoSync();
      
      console.log('✅ Google Drive sync enabled successfully');
      return { success: true };

    } catch (error: any) {
      console.error('Failed to enable Google Drive sync:', error);
      return { success: false, error: error.message || 'Failed to enable sync' };
    }
  }

  /**
   * Disable sync
   */
  static disableSync(): void {
    this.stopAutoSync();
    
    const syncStatus: SyncStatus = {
      isEnabled: false,
      lastSync: null,
      provider: null,
      error: null
    };
    
    localStorage.setItem('sync_status', JSON.stringify(syncStatus));
    console.log('🔇 Sync disabled');
  }

  /**
   * Get current sync status
   */
  static getSyncStatus(): SyncStatus {
    try {
      const stored = localStorage.getItem('sync_status');
      if (stored) {
        const status = JSON.parse(stored);
        // Convert lastSync string back to Date
        if (status.lastSync) {
          status.lastSync = new Date(status.lastSync);
        }
        return status;
      }
    } catch (error) {
      console.error('Failed to parse sync status:', error);
    }

    return {
      isEnabled: false,
      lastSync: null,
      provider: null,
      error: null
    };
  }

  /**
   * Manually trigger sync to cloud
   */
  static async syncToCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!GoogleDriveService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated with Google Drive' };
      }

      console.log('🔄 Syncing habits to Google Drive...');

      // Gather all habit data from localStorage
      const habitData = this.gatherHabitData();
      
      // Create backup object
      const backup: HabitBackup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        habits: habitData.habits,
        userSettings: habitData.userSettings,
        analytics: habitData.analytics
      };

      // Upload to Google Drive
      await GoogleDriveService.uploadFile(
        this.BACKUP_FILE_NAME,
        JSON.stringify(backup, null, 2),
        'application/json'
      );

      // Update sync status
      const syncStatus = this.getSyncStatus();
      syncStatus.lastSync = new Date();
      syncStatus.error = null;
      localStorage.setItem('sync_status', JSON.stringify(syncStatus));

      console.log('✅ Habits synced to Google Drive successfully');
      return { success: true };

    } catch (error: any) {
      console.error('Failed to sync to cloud:', error);
      
      // Update sync status with error
      const syncStatus = this.getSyncStatus();
      syncStatus.error = error.message || 'Sync failed';
      localStorage.setItem('sync_status', JSON.stringify(syncStatus));
      
      return { success: false, error: error.message || 'Sync failed' };
    }
  }

  /**
   * Restore habits from cloud
   */
  static async restoreFromCloud(): Promise<{ success: boolean; error?: string; restored?: number }> {
    try {
      if (!GoogleDriveService.isAuthenticated()) {
        return { success: false, error: 'Not authenticated with Google Drive' };
      }

      console.log('🔄 Restoring habits from Google Drive...');

      // Download backup from Google Drive
      const backupContent = await GoogleDriveService.downloadFile(this.BACKUP_FILE_NAME);
      
      if (!backupContent) {
        return { success: false, error: 'No backup found in Google Drive' };
      }

      const backup: HabitBackup = JSON.parse(backupContent);
      
      // Restore habit data to localStorage
      const restoredCount = this.restoreHabitData(backup);

      console.log(`✅ Restored ${restoredCount} items from Google Drive`);
      return { success: true, restored: restoredCount };

    } catch (error: any) {
      console.error('Failed to restore from cloud:', error);
      return { success: false, error: error.message || 'Restore failed' };
    }
  }

  /**
   * Start automatic sync
   */
  private static startAutoSync(): void {
    this.stopAutoSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(async () => {
      const syncStatus = this.getSyncStatus();
      if (syncStatus.isEnabled && GoogleDriveService.isAuthenticated()) {
        await this.syncToCloud();
      } else {
        this.stopAutoSync();
      }
    }, this.SYNC_INTERVAL);
    
    console.log(`🔄 Auto-sync started (every ${this.SYNC_INTERVAL / 1000 / 60} minutes)`);
  }

  /**
   * Stop automatic sync
   */
  private static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🔇 Auto-sync stopped');
    }
  }

  /**
   * Gather all habit-related data from localStorage
   */
  private static gatherHabitData(): { habits: any[]; userSettings: any; analytics: any } {
    const habits: any[] = [];
    const userSettings: any = {};
    const analytics: any = {};

    // Gather all localStorage keys related to habits
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        // Skip sync-related keys to avoid circular references
        if (key.includes('sync_') || key.includes('google_drive_token')) {
          continue;
        }

        // Categorize the data
        if (key.includes('habit')) {
          habits.push({ key, value: JSON.parse(value) });
        } else if (key.includes('user') || key.includes('settings')) {
          userSettings[key] = JSON.parse(value);
        } else if (key.includes('analytics') || key.includes('progress')) {
          analytics[key] = JSON.parse(value);
        }
      } catch (error) {
        // Skip keys that aren't JSON
        console.warn(`Skipping non-JSON key: ${key}`);
      }
    }

    return { habits, userSettings, analytics };
  }

  /**
   * Restore habit data to localStorage
   */
  private static restoreHabitData(backup: HabitBackup): number {
    let restoredCount = 0;

    try {
      // Restore habits
      backup.habits.forEach(item => {
        localStorage.setItem(item.key, JSON.stringify(item.value));
        restoredCount++;
      });

      // Restore user settings
      Object.entries(backup.userSettings).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
        restoredCount++;
      });

      // Restore analytics
      Object.entries(backup.analytics).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
        restoredCount++;
      });

    } catch (error) {
      console.error('Error restoring habit data:', error);
    }

    return restoredCount;
  }

  /**
   * Get backup info from cloud
   */
  static async getBackupInfo(): Promise<{ exists: boolean; lastModified?: Date; size?: string }> {
    try {
      if (!GoogleDriveService.isAuthenticated()) {
        return { exists: false };
      }

      const files = await GoogleDriveService.listFiles();
      const backupFile = files.find(file => file.name === this.BACKUP_FILE_NAME);

      if (backupFile) {
        return {
          exists: true,
          lastModified: new Date(backupFile.modifiedTime),
          size: backupFile.size
        };
      }

      return { exists: false };
    } catch (error) {
      console.error('Failed to get backup info:', error);
      return { exists: false };
    }
  }
}

// Initialize sync service when module loads
if (typeof window !== 'undefined') {
  HabitSyncService.initialize();
}