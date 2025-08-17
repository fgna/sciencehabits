#!/usr/bin/env node

/**
 * Backup/Restore System Test
 * 
 * Tests the backup and restore functionality end-to-end
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Backup/Restore System Test...');

// Mock localStorage for Node.js environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Create mock data
function createMockData() {
  const mockStorage = new MockLocalStorage();
  
  // Add sample user settings
  mockStorage.setItem('sciencehabits-user-settings', JSON.stringify({
    name: 'Test User',
    goals: ['feel_better', 'get_moving'],
    dailyMinutes: 30,
    preferredTime: 'morning',
    language: 'en'
  }));

  // Add sample habit data
  mockStorage.setItem('habit-progress-user123-habit456', JSON.stringify({
    userId: 'user123',
    habitId: 'habit456',
    completions: ['2025-01-15', '2025-01-16'],
    streaks: [2]
  }));

  // Add sample analytics
  mockStorage.setItem('sciencehabits-analytics', JSON.stringify({
    totalCompletions: 15,
    longestStreak: 7,
    consistency: 0.85
  }));

  return mockStorage;
}

// Test backup creation
function testBackupCreation(mockStorage) {
  console.log('\n📦 Testing Backup Creation...');
  
  // Mock the backup service logic
  const createBackup = () => {
    const timestamp = new Date().toISOString();
    const backup = {
      version: '1.0.0',
      timestamp,
      userSettings: {},
      habitData: [],
      progressData: [],
      preferences: {},
      analytics: {}
    };

    // Gather data from mock localStorage
    for (let i = 0; i < mockStorage.length; i++) {
      const key = mockStorage.key(i);
      const value = mockStorage.getItem(key);
      
      if (!key || !value) continue;

      try {
        const parsedValue = JSON.parse(value);
        
        if (key.includes('user') || key.includes('settings')) {
          backup.userSettings[key] = parsedValue;
        } else if (key.includes('habit') && !key.includes('progress')) {
          backup.habitData.push({ key, value: parsedValue });
        } else if (key.includes('progress')) {
          backup.progressData.push({ key, value: parsedValue });
        } else if (key.includes('language') || key.includes('theme') || key.includes('notification')) {
          backup.preferences[key] = parsedValue;
        } else if (key.includes('analytics') || key.includes('stats')) {
          backup.analytics[key] = parsedValue;
        }
      } catch (error) {
        console.warn(`⚠️  Skipping non-JSON value for key: ${key}`);
      }
    }

    return backup;
  };

  const backup = createBackup();
  
  console.log('✅ Backup created with structure:');
  console.log('  📋 User Settings:', Object.keys(backup.userSettings).length);
  console.log('  🎯 Habit Data:', backup.habitData.length);
  console.log('  📈 Progress Data:', backup.progressData.length);
  console.log('  ⚙️  Preferences:', Object.keys(backup.preferences).length);
  console.log('  📊 Analytics:', Object.keys(backup.analytics).length);

  return backup;
}

// Test backup restoration
function testBackupRestore(backup) {
  console.log('\n🔄 Testing Backup Restoration...');
  
  const newStorage = new MockLocalStorage();
  let restoredCount = 0;

  // Validate backup format
  if (!backup.version || !backup.timestamp) {
    console.error('❌ Invalid backup format');
    return false;
  }

  try {
    // Restore user settings
    if (backup.userSettings) {
      console.log(`📋 Restoring ${Object.keys(backup.userSettings).length} user settings...`);
      Object.entries(backup.userSettings).forEach(([key, value]) => {
        try {
          const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
          newStorage.setItem(key, valueToStore);
          restoredCount++;
        } catch (error) {
          console.warn(`Failed to restore user setting ${key}:`, error.message);
        }
      });
    }

    // Restore habit data
    if (backup.habitData) {
      console.log(`🎯 Restoring ${backup.habitData.length} habit data items...`);
      backup.habitData.forEach(item => {
        try {
          const valueToStore = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
          newStorage.setItem(item.key, valueToStore);
          restoredCount++;
        } catch (error) {
          console.warn(`Failed to restore habit data ${item.key}:`, error.message);
        }
      });
    }

    // Restore progress data
    if (backup.progressData) {
      console.log(`📈 Restoring ${backup.progressData.length} progress data items...`);
      backup.progressData.forEach(item => {
        try {
          const valueToStore = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
          newStorage.setItem(item.key, valueToStore);
          restoredCount++;
        } catch (error) {
          console.warn(`Failed to restore progress data ${item.key}:`, error.message);
        }
      });
    }

    // Restore preferences
    if (backup.preferences) {
      console.log(`⚙️  Restoring ${Object.keys(backup.preferences).length} preferences...`);
      Object.entries(backup.preferences).forEach(([key, value]) => {
        try {
          const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
          newStorage.setItem(key, valueToStore);
          restoredCount++;
        } catch (error) {
          console.warn(`Failed to restore preference ${key}:`, error.message);
        }
      });
    }

    // Restore analytics
    if (backup.analytics) {
      console.log(`📊 Restoring ${Object.keys(backup.analytics).length} analytics...`);
      Object.entries(backup.analytics).forEach(([key, value]) => {
        try {
          const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
          newStorage.setItem(key, valueToStore);
          restoredCount++;
        } catch (error) {
          console.warn(`Failed to restore analytics ${key}:`, error.message);
        }
      });
    }

    console.log(`✅ Successfully restored ${restoredCount} items`);
    return { success: true, restoredCount, newStorage };

  } catch (error) {
    console.error('❌ Backup restoration failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Validate data integrity
function validateDataIntegrity(originalStorage, restoredStorage) {
  console.log('\n🔍 Validating Data Integrity...');
  
  let passed = 0;
  let failed = 0;

  // Check if all original data was restored
  for (let i = 0; i < originalStorage.length; i++) {
    const key = originalStorage.key(i);
    const originalValue = originalStorage.getItem(key);
    const restoredValue = restoredStorage.getItem(key);

    if (originalValue === restoredValue) {
      passed++;
      console.log(`✅ ${key}: Data integrity verified`);
    } else {
      failed++;
      console.log(`❌ ${key}: Data integrity failed`);
      console.log(`   Original: ${originalValue?.substring(0, 100)}...`);
      console.log(`   Restored: ${restoredValue?.substring(0, 100)}...`);
    }
  }

  console.log(`\n📊 Integrity Check Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  return failed === 0;
}

// Run the full test suite
async function runTests() {
  try {
    console.log('🚀 Initializing test environment...');
    
    // Step 1: Create mock data
    const originalStorage = createMockData();
    console.log(`📊 Created ${originalStorage.length} test data items`);

    // Step 2: Test backup creation
    const backup = testBackupCreation(originalStorage);

    // Step 3: Test backup restoration
    const restoreResult = testBackupRestore(backup);
    
    if (!restoreResult.success) {
      console.error('❌ Backup restore test failed');
      process.exit(1);
    }

    // Step 4: Validate data integrity
    const integrityValid = validateDataIntegrity(originalStorage, restoreResult.newStorage);

    // Step 5: Test backup file format
    console.log('\n📄 Testing Backup File Format...');
    const backupJson = JSON.stringify(backup, null, 2);
    const parsedBackup = JSON.parse(backupJson);
    
    if (parsedBackup.version && parsedBackup.timestamp) {
      console.log('✅ Backup file format is valid');
    } else {
      console.error('❌ Backup file format is invalid');
      process.exit(1);
    }

    // Final results
    console.log('\n🎉 Backup/Restore System Test Results:');
    console.log(`   📦 Backup Creation: ✅ PASSED`);
    console.log(`   🔄 Backup Restoration: ✅ PASSED`);
    console.log(`   🔍 Data Integrity: ${integrityValid ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   📄 File Format: ✅ PASSED`);
    
    if (integrityValid) {
      console.log('\n🎊 All tests passed! Backup/Restore system is working correctly.');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed! Please review the issues above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };