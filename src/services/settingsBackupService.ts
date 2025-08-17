/**
 * Settings Backup Service
 * 
 * Provides functionality to backup and restore user settings,
 * habits, and preferences including IndexedDB data.
 */

export interface BackupData {
  version: string;
  timestamp: string;
  userSettings: any;
  habitData: any[];
  progressData: any[];
  preferences: any;
  analytics: any;
  indexedDBData?: {
    users: any[];
    habits: any[];
    progress: any[];
    research: any[];
    offlineQueue?: any[];
  };
}

export class SettingsBackupService {
  private static readonly BACKUP_VERSION = '1.0.0';

  /**
   * Create a complete backup of user data
   */
  static async createBackup(): Promise<BackupData> {
    const timestamp = new Date().toISOString();
    
    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      timestamp,
      userSettings: this.gatherUserSettings(),
      habitData: this.gatherHabitData(),
      progressData: this.gatherProgressData(),
      preferences: this.gatherPreferences(),
      analytics: this.gatherAnalytics()
    };

    // Add IndexedDB data
    try {
      backup.indexedDBData = await this.gatherIndexedDBData();
      console.log('📊 IndexedDB data included in backup');
    } catch (error) {
      console.warn('⚠️ Failed to gather IndexedDB data:', error);
    }

    return backup;
  }

  /**
   * Export backup as downloadable JSON file
   */
  static async exportBackup(): Promise<void> {
    const backup = await this.createBackup();
    const filename = `sciencehabits-backup-${backup.timestamp.split('T')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Restore from backup data
   */
  static async restoreFromBackup(backup: BackupData): Promise<{ success: boolean; error?: string; restored: number }> {
    try {
      let restoredCount = 0;

      console.log('🔄 Starting backup restoration...');
      console.log('📄 Backup data structure:', {
        version: backup.version,
        timestamp: backup.timestamp,
        userSettings: backup.userSettings ? Object.keys(backup.userSettings).length : 0,
        habitData: backup.habitData ? backup.habitData.length : 0,
        progressData: backup.progressData ? backup.progressData.length : 0,
        preferences: backup.preferences ? Object.keys(backup.preferences).length : 0,
        analytics: backup.analytics ? Object.keys(backup.analytics).length : 0
      });

      // Validate backup format
      if (!backup.version || !backup.timestamp) {
        return { success: false, error: 'Invalid backup format - missing version or timestamp', restored: 0 };
      }

      // Restore user settings
      if (backup.userSettings) {
        console.log(`📋 Restoring ${Object.keys(backup.userSettings).length} user settings...`);
        Object.entries(backup.userSettings).forEach(([key, value]) => {
          try {
            // value is already parsed from the backup, so stringify it for localStorage
            const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, valueToStore);
            restoredCount++;
          } catch (error) {
            console.warn(`Failed to restore user setting ${key}:`, error);
          }
        });
        console.log(`✅ User settings restored`);
      }

      // Restore habit data
      if (backup.habitData) {
        console.log(`🎯 Restoring ${backup.habitData.length} habit data items...`);
        backup.habitData.forEach(item => {
          try {
            // item.value is already parsed, so we need to stringify it for localStorage
            const valueToStore = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
            localStorage.setItem(item.key, valueToStore);
            restoredCount++;
          } catch (error) {
            console.warn(`Failed to restore habit data ${item.key}:`, error);
          }
        });
        console.log(`✅ Habit data restored`);
      }

      // Restore progress data
      if (backup.progressData) {
        console.log(`📈 Restoring ${backup.progressData.length} progress data items...`);
        backup.progressData.forEach(item => {
          try {
            // item.value is already parsed, so we need to stringify it for localStorage
            const valueToStore = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
            localStorage.setItem(item.key, valueToStore);
            restoredCount++;
          } catch (error) {
            console.warn(`Failed to restore progress data ${item.key}:`, error);
          }
        });
        console.log(`✅ Progress data restored`);
      }

      // Restore preferences
      if (backup.preferences) {
        Object.entries(backup.preferences).forEach(([key, value]) => {
          // value is already parsed from the backup, so stringify it for localStorage
          const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, valueToStore);
          restoredCount++;
        });
      }

      // Restore analytics
      if (backup.analytics) {
        Object.entries(backup.analytics).forEach(([key, value]) => {
          // value is already parsed from the backup, so stringify it for localStorage
          const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, valueToStore);
          restoredCount++;
        });
      }

      // Restore IndexedDB data
      if (backup.indexedDBData) {
        console.log('📊 Restoring IndexedDB data...');
        try {
          const indexedDBRestoredCount = await this.restoreIndexedDBData(backup.indexedDBData);
          restoredCount += indexedDBRestoredCount;
          console.log(`✅ IndexedDB data restored: ${indexedDBRestoredCount} items`);
        } catch (error) {
          console.warn('⚠️ Failed to restore IndexedDB data:', error);
        }
      }

      console.log(`✅ Backup restoration completed! Restored ${restoredCount} items.`);
      console.log('🔄 Page refresh recommended to see all changes.');
      
      return { success: true, restored: restoredCount };

    } catch (error) {
      console.error('Failed to restore backup:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed',
        restored: 0 
      };
    }
  }

  /**
   * Import backup from file
   */
  static importBackup(file: File): Promise<{ success: boolean; error?: string; restored?: number }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const backup: BackupData = JSON.parse(content);
          
          const result = await this.restoreFromBackup(backup);
          resolve(result);
          
        } catch (error) {
          resolve({ 
            success: false, 
            error: 'Invalid backup file format' 
          });
        }
      };
      
      reader.onerror = () => {
        resolve({ 
          success: false, 
          error: 'Failed to read backup file' 
        });
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Test backup/restore functionality in browser environment
   */
  static async testBackupRestoreInBrowser(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing backup/restore in browser environment...');
      
      // Step 1: Create some test data
      const testKey = 'test-user-settings-' + Date.now();
      const testData = {
        testValue: 'backup-test-success',
        timestamp: new Date().toISOString(),
        randomValue: Math.random()
      };
      
      localStorage.setItem(testKey, JSON.stringify(testData));
      console.log('📝 Created test data:', testKey);
      
      // Step 2: Create backup
      const backup = await this.createBackup();
      console.log('📦 Created backup with', Object.keys(backup.userSettings || {}).length + (backup.habitData?.length || 0) + (backup.progressData?.length || 0), 'items');
      console.log('📦 Backup userSettings keys:', Object.keys(backup.userSettings || {}));
      console.log('📦 Test key in backup?', backup.userSettings && testKey in backup.userSettings);
      
      // Step 3: Clear test data
      localStorage.removeItem(testKey);
      console.log('🗑️ Removed test data');
      console.log('🔍 Verify removal - key exists?', localStorage.getItem(testKey) !== null);
      
      // Step 4: Restore backup
      const restoreResult = await this.restoreFromBackup(backup);
      console.log('🔄 Restore result:', restoreResult);
      
      // Step 5: Verify restoration
      console.log('🔍 Checking if test key was restored...');
      const restoredValue = localStorage.getItem(testKey);
      console.log('🔍 Restored value:', restoredValue);
      if (restoredValue) {
        const parsedValue = JSON.parse(restoredValue);
        if (parsedValue.testValue === testData.testValue) {
          console.log('✅ Browser backup/restore test PASSED');
          localStorage.removeItem(testKey); // Clean up
          return { 
            success: true, 
            message: `Backup/restore test passed! Restored ${restoreResult.restored} items successfully.`
          };
        } else {
          throw new Error('Restored data does not match original');
        }
      } else {
        throw new Error('Test data was not restored');
      }
      
    } catch (error) {
      console.error('❌ Browser backup/restore test FAILED:', error);
      return { 
        success: false, 
        message: `Backup/restore test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get backup info without creating full backup
   */
  static async getBackupInfo(): Promise<{ 
    itemCount: number; 
    dataSize: string; 
    lastBackup?: string;
    categories: { [key: string]: number };
  }> {
    const categories = {
      habits: 0,
      progress: 0,
      settings: 0,
      analytics: 0
    };

    let totalSize = 0;
    let totalItems = 0;

    // Count localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
        totalItems++;

        if (key.includes('habit')) {
          categories.habits++;
        } else if (key.includes('progress')) {
          categories.progress++;
        } else if (key.includes('settings') || key.includes('user')) {
          categories.settings++;
        } else if (key.includes('analytics')) {
          categories.analytics++;
        }
      }
    }

    // Count IndexedDB items
    try {
      const { db } = await import('./storage/database');
      
      const [users, allHabits, progress, research] = await Promise.all([
        db.users.count(),
        db.habits.count(),
        db.progress.count(),
        db.research.count()
      ]);

      // Count active habits (habits with progress entries - what user is actually tracking)
      const progressEntries = await db.progress.toArray();
      const activeHabitIds = new Set(progressEntries.map(p => p.habitId));
      const activeHabitsCount = activeHabitIds.size;

      // Get actual habit details for debugging
      const activeHabits = await db.habits.where('id').anyOf(Array.from(activeHabitIds)).toArray();

      // Show user's active data rather than entire database
      categories.settings += users; // Users count as settings
      categories.habits = activeHabitsCount; // Only actively tracked habits
      categories.progress = progress; // All progress entries
      categories.analytics += research; // Research articles count as analytics

      totalItems += users + activeHabitsCount + progress + research;

      // Estimate IndexedDB size (rough approximation)
      const estimatedIndexedDBSize = (users + activeHabitsCount + progress + research) * 200;
      totalSize += estimatedIndexedDBSize;

      console.log('📊 User\'s active data:', { 
        users, 
        totalHabitsInDB: allHabits,
        activeHabits: activeHabitsCount, 
        progress, 
        research 
      });
      console.log('🎯 Active habit IDs with progress:', Array.from(activeHabitIds));
      console.log('🎯 Active habit titles:', activeHabits.map(h => h.title || h.id));
    } catch (error) {
      console.warn('⚠️ Could not access IndexedDB for backup info:', error);
    }

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return {
      itemCount: totalItems,
      dataSize: formatSize(totalSize),
      categories
    };
  }

  // Private helper methods

  private static gatherUserSettings(): any {
    const settings: any = {};
    
    // Include Zustand store data which is the main user data
    const zustandKeys = [
      'user-store', 
      'sciencehabits-user-store',
      'habit-store',
      'analytics-store',
      'ui-preferences-store',
      'sciencehabits-ui-preferences'
    ];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Check for user-related data, settings, and zustand stores
      if (key.includes('user') || 
          key.includes('settings') || 
          key.includes('preferences') ||
          key.includes('store') ||
          zustandKeys.some(zkey => key.includes(zkey))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            console.log(`📋 Gathering user setting: ${key}`);
            settings[key] = JSON.parse(value);
          }
        } catch (error) {
          console.warn(`⚠️  Skipping non-JSON user setting: ${key}`);
          // Store as string if it's not JSON
          const value = localStorage.getItem(key);
          if (value) {
            settings[key] = value;
          }
        }
      }
    }

    console.log(`📋 Gathered ${Object.keys(settings).length} user settings`);
    return settings;
  }

  private static gatherHabitData(): any[] {
    const habits: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Look for habit-related data but exclude progress
      if ((key.includes('habit') && !key.includes('progress')) ||
          key.includes('onboarding') ||
          key.includes('recommendation')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            console.log(`🎯 Gathering habit data: ${key}`);
            // Store the raw string value, parse only for validation
            try {
              JSON.parse(value); // Validate it's valid JSON
              habits.push({ key, value: JSON.parse(value) });
            } catch {
              // If it's not JSON, store as string
              console.log(`⚠️  Storing non-JSON habit data as string: ${key}`);
              habits.push({ key, value });
            }
          }
        } catch (error) {
          console.warn(`⚠️  Failed to gather habit data: ${key}`, error);
        }
      }
    }

    console.log(`🎯 Gathered ${habits.length} habit data items`);
    return habits;
  }

  private static gatherProgressData(): any[] {
    const progress: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Look for progress, completion, streak, and analytics data
      if (key.includes('progress') ||
          key.includes('completion') ||
          key.includes('streak') ||
          key.includes('analytics')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            console.log(`📈 Gathering progress data: ${key}`);
            // Store the raw string value, parse only for validation
            try {
              JSON.parse(value); // Validate it's valid JSON
              progress.push({ key, value: JSON.parse(value) });
            } catch {
              // If it's not JSON, store as string
              console.log(`⚠️  Storing non-JSON progress data as string: ${key}`);
              progress.push({ key, value });
            }
          }
        } catch (error) {
          console.warn(`⚠️  Failed to gather progress data: ${key}`, error);
        }
      }
    }

    console.log(`📈 Gathered ${progress.length} progress data items`);
    return progress;
  }

  private static gatherPreferences(): any {
    const preferences: any = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.includes('language') || key.includes('theme') || key.includes('notification')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            preferences[key] = JSON.parse(value);
          }
        } catch (error) {
          // Skip non-JSON values
        }
      }
    }

    return preferences;
  }

  private static gatherAnalytics(): any {
    const analytics: any = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.includes('analytics') || key.includes('stats')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            analytics[key] = JSON.parse(value);
          }
        } catch (error) {
          // Skip non-JSON values
        }
      }
    }

    return analytics;
  }

  /**
   * Export entire IndexedDB database directly
   */
  private static async gatherIndexedDBData(): Promise<{
    users: any[];
    habits: any[];
    progress: any[];
    research: any[];
    offlineQueue?: any[];
  }> {
    try {
      // Import the database - using dynamic import to avoid circular dependency
      const { db } = await import('./storage/database');
      
      console.log('📊 Gathering complete IndexedDB database...');
      
      // Export all tables completely
      const [users, habits, progress, research] = await Promise.all([
        db.users.toArray(),
        db.habits.toArray(),
        db.progress.toArray(),
        db.research.toArray()
      ]);

      let offlineQueue: any[] = [];
      try {
        offlineQueue = await db.offlineQueue.toArray();
      } catch (error) {
        console.log('No offline queue table found (this is normal for older versions)');
      }

      console.log(`📊 Complete IndexedDB database exported:`, {
        users: users.length,
        habits: habits.length,
        progress: progress.length,
        research: research.length,
        offlineQueue: offlineQueue.length,
        totalSize: users.length + habits.length + progress.length + research.length + offlineQueue.length
      });

      return {
        users,
        habits,
        progress,
        research,
        offlineQueue: offlineQueue.length > 0 ? offlineQueue : undefined
      };
    } catch (error) {
      console.error('Failed to export IndexedDB database:', error);
      throw error;
    }
  }

  /**
   * Import entire IndexedDB database directly
   */
  private static async restoreIndexedDBData(indexedDBData: {
    users: any[];
    habits: any[];
    progress: any[];
    research: any[];
    offlineQueue?: any[];
  }): Promise<number> {
    try {
      // Import the database
      const { db } = await import('./storage/database');
      
      let restoredCount = 0;

      console.log('📊 Importing complete IndexedDB database...');

      // Clear existing data completely
      console.log('🗑️ Clearing existing IndexedDB database...');
      await Promise.all([
        db.users.clear(),
        db.habits.clear(),
        db.progress.clear(),
        db.research.clear()
      ]);

      try {
        await db.offlineQueue.clear();
      } catch (error) {
        // Offline queue might not exist in older versions
      }

      // Restore all tables in bulk
      const restoreOperations = [];

      if (indexedDBData.users?.length > 0) {
        restoreOperations.push(
          db.users.bulkAdd(indexedDBData.users).then(() => {
            console.log(`✅ Imported ${indexedDBData.users.length} users`);
            return indexedDBData.users.length;
          })
        );
      }

      if (indexedDBData.habits?.length > 0) {
        restoreOperations.push(
          db.habits.bulkAdd(indexedDBData.habits).then(() => {
            console.log(`✅ Imported ${indexedDBData.habits.length} habits`);
            return indexedDBData.habits.length;
          })
        );
      }

      if (indexedDBData.progress?.length > 0) {
        restoreOperations.push(
          db.progress.bulkAdd(indexedDBData.progress).then(() => {
            console.log(`✅ Imported ${indexedDBData.progress.length} progress entries`);
            return indexedDBData.progress.length;
          })
        );
      }

      if (indexedDBData.research?.length > 0) {
        restoreOperations.push(
          db.research.bulkAdd(indexedDBData.research).then(() => {
            console.log(`✅ Imported ${indexedDBData.research.length} research articles`);
            return indexedDBData.research.length;
          })
        );
      }

      if (indexedDBData.offlineQueue && indexedDBData.offlineQueue.length > 0) {
        restoreOperations.push(
          db.offlineQueue.bulkAdd(indexedDBData.offlineQueue).then(() => {
            console.log(`✅ Imported ${indexedDBData.offlineQueue!.length} offline queue items`);
            return indexedDBData.offlineQueue!.length;
          }).catch(() => {
            console.log('Could not import offline queue (table might not exist in this version)');
            return 0;
          })
        );
      }

      // Execute all restore operations in parallel
      const counts = await Promise.all(restoreOperations);
      restoredCount = counts.reduce((sum, count) => sum + count, 0);

      console.log(`✅ Complete IndexedDB database imported: ${restoredCount} total items`);
      return restoredCount;

    } catch (error) {
      console.error('Failed to import IndexedDB database:', error);
      throw error;
    }
  }
}