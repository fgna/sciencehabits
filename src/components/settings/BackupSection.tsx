/**
 * Backup Section Component
 * 
 * MVP: Simplified backup and restore functionality for user data
 */

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { SettingsBackupService } from '../../services/settingsBackupService';

interface BackupInfo {
  itemCount: number;
  dataSize: string;
  lastBackup?: string;
  categories: {
    habits: number;
    progress: number;
    settings: number;
    analytics: number;
  };
}

export function BackupSection() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [isTestingBrowser, setIsTestingBrowser] = useState(false);
  const [backupInfo, setBackupInfo] = useState<BackupInfo>({
    itemCount: 0,
    dataSize: '0 B',
    categories: { habits: 0, progress: 0, settings: 0, analytics: 0 }
  });
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  // Load backup info on component mount
  useEffect(() => {
    const loadBackupInfo = async () => {
      try {
        setIsLoadingInfo(true);
        const info = await SettingsBackupService.getBackupInfo();
        setBackupInfo({
          itemCount: info.itemCount,
          dataSize: info.dataSize,
          lastBackup: info.lastBackup,
          categories: {
            habits: info.categories.habits || 0,
            progress: info.categories.progress || 0,
            settings: info.categories.settings || 0,
            analytics: info.categories.analytics || 0
          }
        });
      } catch (error) {
        console.error('Failed to load backup info:', error);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    loadBackupInfo();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await SettingsBackupService.exportBackup();
      console.log('✅ Backup created and downloaded');
      
      // Refresh backup info after creating backup
      const info = await SettingsBackupService.getBackupInfo();
      setBackupInfo({
        itemCount: info.itemCount,
        dataSize: info.dataSize,
        lastBackup: info.lastBackup,
        categories: {
          habits: info.categories.habits || 0,
          progress: info.categories.progress || 0,
          settings: info.categories.settings || 0,
          analytics: info.categories.analytics || 0
        }
      });
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreMessage(null);

    try {
      const result = await SettingsBackupService.importBackup(file);
      
      if (result.success) {
        setRestoreMessage(`✅ Successfully restored ${result.restored} items. Please refresh the page to see all changes.`);
        
        // Refresh backup info to reflect restored data
        try {
          const info = await SettingsBackupService.getBackupInfo();
          setBackupInfo({
            itemCount: info.itemCount,
            dataSize: info.dataSize,
            lastBackup: info.lastBackup,
            categories: {
              habits: info.categories.habits || 0,
              progress: info.categories.progress || 0,
              settings: info.categories.settings || 0,
              analytics: info.categories.analytics || 0
            }
          });
        } catch (error) {
          console.error('Failed to refresh backup info after restore:', error);
        }
        
        // Auto-refresh after a short delay to give user time to read the message
        setTimeout(() => {
          if (window.confirm('Backup restored successfully! Would you like to refresh the page now to see all changes?')) {
            window.location.reload();
          }
        }, 2000);
      } else {
        setRestoreMessage(`❌ Restore failed: ${result.error}`);
      }
    } catch (error) {
      setRestoreMessage(`❌ Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRestoring(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleTestBrowserBackup = async () => {
    setIsTestingBrowser(true);
    setRestoreMessage(null);

    try {
      const result = await SettingsBackupService.testBackupRestoreInBrowser();
      
      if (result.success) {
        setRestoreMessage(`✅ Browser test passed: ${result.message}`);
      } else {
        setRestoreMessage(`❌ Browser test failed: ${result.message}`);
      }
    } catch (error) {
      setRestoreMessage(`❌ Browser test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingBrowser(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">💾 Data Backup</h2>
      
      {/* Current Data Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">Current Data</h3>
        {isLoadingInfo ? (
          <div className="text-sm text-gray-600">Loading backup information...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Items:</span>
              <span className="ml-2 font-medium">{backupInfo.itemCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Data Size:</span>
              <span className="ml-2 font-medium">{backupInfo.dataSize}</span>
            </div>
            <div>
              <span className="text-gray-600">Habits:</span>
              <span className="ml-2 font-medium">{backupInfo.categories.habits}</span>
            </div>
            <div>
              <span className="text-gray-600">Progress:</span>
              <span className="ml-2 font-medium">{backupInfo.categories.progress}</span>
            </div>
          </div>
        )}
      </div>

      {/* Backup Actions */}
      <div className="space-y-4">
        {/* Create Backup */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">Create Backup</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download a complete backup of your habits, progress, and settings.
            </p>
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="w-full"
            >
              {isCreatingBackup ? 'Creating Backup...' : '📥 Download Backup'}
            </Button>
          </div>
        </div>

        {/* Development Test Button */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex items-start gap-4 border-t pt-4">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">🧪 Test Backup System</h3>
              <p className="text-sm text-gray-600 mb-3">
                Development only: Test backup/restore functionality in browser environment.
              </p>
              <Button
                onClick={handleTestBrowserBackup}
                disabled={isTestingBrowser}
                variant="outline"
                className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                {isTestingBrowser ? 'Testing...' : '🧪 Test Backup/Restore'}
              </Button>
            </div>
          </div>
        )}

        {/* Restore Backup */}
        <div className="border-t pt-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Restore Backup</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload a backup file to restore your data. This will overwrite current data.
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  disabled={isRestoring}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {isRestoring && (
                <p className="text-sm text-blue-600 mt-2">Restoring backup...</p>
              )}
              {restoreMessage && (
                <p className={`text-sm mt-2 ${restoreMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {restoreMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600">⚠️</span>
          <div className="text-sm">
            <p className="font-medium text-yellow-800 mb-1">Important Notes:</p>
            <ul className="text-yellow-700 space-y-1">
              <li>• Backups include all your local data and settings</li>
              <li>• Restoring will overwrite your current data</li>
              <li>• Create regular backups to prevent data loss</li>
              <li>• MVP Version: Local storage only, no cloud sync</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}