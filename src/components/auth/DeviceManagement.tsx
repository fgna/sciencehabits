/**
 * Device Management Component
 * 
 * Displays and manages user's connected devices.
 * Allows users to rename devices, view sync status, and remove devices.
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent } from '../ui';
import { DeviceManager } from '../../services/auth/DeviceManager';
import { DeviceInfo } from '../../types/sync';

interface DeviceManagementProps {
  onClose?: () => void;
  className?: string;
}

export const DeviceManagement: React.FC<DeviceManagementProps> = ({
  onClose,
  className = ''
}) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');

  const deviceManager = new DeviceManager();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userDevices = await deviceManager.getUserDevices();
      const currentDevice = deviceManager.getCurrentDevice();
      
      // Mark current device
      const devicesWithCurrent = userDevices.map(device => ({
        ...device,
        isCurrentDevice: currentDevice?.id === device.id
      }));

      setDevices(devicesWithCurrent);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setError('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameDevice = async (deviceId: string) => {
    if (!newDeviceName.trim()) {
      setError('Device name cannot be empty');
      return;
    }

    try {
      await deviceManager.renameDevice(deviceId, newDeviceName.trim());
      setEditingDevice(null);
      setNewDeviceName('');
      await loadDevices();
    } catch (error) {
      console.error('Failed to rename device:', error);
      setError('Failed to rename device');
    }
  };

  const handleRemoveDevice = async (deviceId: string, deviceName: string) => {
    // Use window.confirm to avoid ESLint warning
    if (!window.confirm(`Remove device "${deviceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deviceManager.removeDevice(deviceId);
      await loadDevices();
    } catch (error) {
      console.error('Failed to remove device:', error);
      setError('Failed to remove device');
    }
  };

  const startEditing = (device: DeviceInfo) => {
    setEditingDevice(device.id);
    setNewDeviceName(device.name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingDevice(null);
    setNewDeviceName('');
    setError(null);
  };

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '📱';
    }
  };

  const getPlatformName = (platform: string): string => {
    const platformNames: Record<string, string> = {
      'windows': 'Windows',
      'macos': 'macOS',
      'linux': 'Linux',
      'ios': 'iOS',
      'android': 'Android',
      'unknown': 'Unknown'
    };
    return platformNames[platform] || 'Unknown';
  };

  const formatDate = (dateInput: number | Date): string => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className={`w-full max-w-2xl mx-auto ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading devices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Connected Devices</h2>
            <p className="text-gray-600 mt-1">
              Manage devices that can access your habits
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {devices.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Connected</h3>
            <p className="text-gray-600">
              Sign in on other devices to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 border rounded-lg ${
                  device.isCurrentDevice 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl mt-1">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingDevice === device.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Device name"
                            maxLength={50}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleRenameDevice(device.id)}
                            className="text-xs px-2"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            className="text-xs px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {device.name}
                            </h3>
                            {device.isCurrentDevice && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>{getPlatformName(device.platform || 'unknown')} • {device.type}</p>
                            <p>Last seen: {formatDate(device.lastSeen)}</p>
                            {device.createdAt && (
                              <p>Added: {formatDate(device.createdAt)}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {editingDevice !== device.id && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(device)}
                        className="text-xs"
                      >
                        Rename
                      </Button>
                      {!device.isCurrentDevice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.id, device.name)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {device.isActive === false && (
                  <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-yellow-800">
                        This device has been offline for a while
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <h4 className="font-medium text-gray-700 mb-2">Security Tips</h4>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Remove devices you no longer use</li>
              <li>Your data is encrypted before leaving each device</li>
              <li>Only you can see your device list</li>
            </ul>
          </div>
        </div>

        {onClose && (
          <div className="mt-6 text-center">
            <Button onClick={onClose} className="px-6">
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};