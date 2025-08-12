/**
 * Reminder Settings Modal
 * 
 * Allows users to configure their habit reminders and notifications
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader } from '../ui';
import { useReminders } from '../../contexts/ReminderContext';
import { useUserStore } from '../../stores/userStore';

interface ReminderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PermissionState {
  supported: boolean;
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export function ReminderSettings({ isOpen, onClose }: ReminderSettingsProps) {
  const { isEnabled, hasPermission, refreshReminders, getStats } = useReminders();
  const { userHabits, userProgress } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>({
    supported: false,
    granted: false,
    denied: false,
    default: true
  });

  // Check browser notification support and permission status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'Notification' in window;
      if (supported) {
        const permission = Notification.permission;
        setPermissionState({
          supported: true,
          granted: permission === 'granted',
          denied: permission === 'denied',
          default: permission === 'default'
        });
      } else {
        setPermissionState({
          supported: false,
          granted: false,
          denied: false,
          default: false
        });
      }
    }
  }, [isOpen]);

  const handleEnableNotifications = async () => {
    if (!permissionState.supported) {
      alert('Browser notifications are not supported in your browser.');
      return;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(prev => ({
        ...prev,
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      }));

      if (permission === 'granted') {
        await refreshReminders();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = () => {
    if (permissionState.granted) {
      new Notification('ScienceHabits Test', {
        body: 'This is a test notification. Your habit reminders are working!',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
    }
  };

  const scheduleAllReminders = async () => {
    setIsLoading(true);
    try {
      // Use the refresh function from context which handles scheduling
      await refreshReminders();
    } catch (error) {
      console.error('Failed to schedule reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllReminders = async () => {
    setIsLoading(true);
    try {
      // Use direct service access for clearing
      const { reminderService } = await import('../../services/reminderService');
      await reminderService.clearAllReminders();
      await refreshReminders();
    } catch (error) {
      console.error('Failed to clear reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Reminder Settings
              </h2>
              <p className="text-sm text-gray-500">
                Configure your habit reminders and notifications
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[calc(90vh-120px)] overflow-y-auto space-y-6">
          
          {/* Browser Support & Permission Status */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Notification Status</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Browser Support */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Browser Support</span>
                  <div className={`flex items-center space-x-2 ${permissionState.supported ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="text-sm font-medium">
                      {permissionState.supported ? 'Supported' : 'Not Supported'}
                    </span>
                    {permissionState.supported ? '✓' : '✗'}
                  </div>
                </div>

                {/* Permission Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Permission Status</span>
                  <div className={`flex items-center space-x-2 ${
                    permissionState.granted ? 'text-green-600' : 
                    permissionState.denied ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    <span className="text-sm font-medium">
                      {permissionState.granted ? 'Granted' : 
                       permissionState.denied ? 'Denied' : 'Not Requested'}
                    </span>
                    {permissionState.granted ? '✓' : permissionState.denied ? '✗' : '⚠'}
                  </div>
                </div>

                {/* Reminder Service Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Reminder Service</span>
                  <div className={`flex items-center space-x-2 ${isEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                    <span className="text-sm font-medium">
                      {isEnabled ? 'Active' : 'Inactive'}
                    </span>
                    {isEnabled ? '✓' : '○'}
                  </div>
                </div>
              </div>

              {/* Enable Notifications Button */}
              {!permissionState.granted && permissionState.supported && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Requesting...' : 'Enable Notifications'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    You'll be asked to allow notifications for this website
                  </p>
                </div>
              )}

              {/* Test Notification */}
              {permissionState.granted && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={handleTestNotification}
                    className="w-full"
                  >
                    Send Test Notification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminder Statistics */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Reminder Statistics</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalScheduled}</div>
                  <div className="text-sm text-blue-800">Total Scheduled</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.byType?.daily || 0}</div>
                  <div className="text-sm text-green-800">Daily Reminders</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.byType?.weekly || 0}</div>
                  <div className="text-sm text-purple-800">Weekly Reminders</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{userHabits.length}</div>
                  <div className="text-sm text-orange-800">Total Habits</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminder Management */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Reminder Management</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={scheduleAllReminders}
                  disabled={isLoading || !permissionState.granted}
                  className="w-full"
                >
                  {isLoading ? 'Scheduling...' : 'Reschedule All Reminders'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={clearAllReminders}
                  disabled={isLoading}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isLoading ? 'Clearing...' : 'Clear All Reminders'}
                </Button>

                <p className="text-xs text-gray-500">
                  Use "Reschedule" to refresh reminders based on your current habits and preferences.
                  Use "Clear" to remove all scheduled reminders.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Help & Information</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <strong>How reminders work:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Reminders are calculated based on your habit frequency and optimal timing</li>
                    <li>Daily habits get smart reminders at your most successful times</li>
                    <li>Weekly habits get distributed reminders throughout the week</li>
                    <li>Periodic habits get reminders before they're due</li>
                  </ul>
                </div>
                
                <div>
                  <strong>Troubleshooting:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>If notifications aren't working, try the "Send Test Notification" button</li>
                    <li>Make sure your browser allows notifications for this site</li>
                    <li>Check your device's notification settings</li>
                    <li>Close and reopen the browser if permissions seem stuck</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}