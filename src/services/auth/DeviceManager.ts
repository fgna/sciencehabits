/**
 * Device Management Service
 * 
 * Handles device registration, linking, and management for multi-device sync.
 * Each device gets a unique ID and can be named by the user.
 */

import { DeviceInfo, User } from '../../types/sync';
import { UserAuthentication } from './UserAuthentication';

export class DeviceManager {
  private userAuth: UserAuthentication;
  private currentDeviceId: string | null = null;

  constructor() {
    this.userAuth = new UserAuthentication();
    this.initializeCurrentDevice();
  }

  /**
   * Initialize current device information
   */
  private async initializeCurrentDevice(): Promise<void> {
    try {
      // Try to get existing device ID from localStorage
      this.currentDeviceId = localStorage.getItem('device-id');
      
      if (!this.currentDeviceId) {
        // Generate new device ID if none exists
        this.currentDeviceId = this.generateDeviceId();
        localStorage.setItem('device-id', this.currentDeviceId);
        console.log('🆔 Generated new device ID:', this.currentDeviceId);
      } else {
        console.log('📱 Using existing device ID:', this.currentDeviceId);
      }
    } catch (error) {
      console.error('Failed to initialize device:', error);
    }
  }

  /**
   * Register current device for a user
   */
  async registerCurrentDevice(user: User, deviceName?: string): Promise<DeviceInfo> {
    if (!this.currentDeviceId) {
      throw new Error('Device not initialized');
    }

    const deviceInfo: DeviceInfo = {
      id: this.currentDeviceId,
      name: deviceName || this.getDefaultDeviceName(),
      type: this.getDeviceType(),
      platform: this.getPlatform(),
      lastSeen: new Date(),
      isActive: true,
      userAgent: navigator.userAgent,
      createdAt: new Date()
    };

    try {
      // Link device to user account
      await this.userAuth.linkDevice(deviceInfo);
      
      // Store device info locally
      localStorage.setItem('current-device', JSON.stringify(deviceInfo));
      
      console.log('✅ Device registered successfully:', deviceInfo);
      return deviceInfo;
    } catch (error) {
      console.error('Failed to register device:', error);
      throw new Error('Device registration failed');
    }
  }

  /**
   * Get current device information
   */
  getCurrentDevice(): DeviceInfo | null {
    try {
      const stored = localStorage.getItem('current-device');
      if (stored) {
        const device: DeviceInfo = JSON.parse(stored);
        
        // Update last seen timestamp
        device.lastSeen = new Date();
        localStorage.setItem('current-device', JSON.stringify(device));
        
        return device;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current device:', error);
      return null;
    }
  }

  /**
   * Update current device information
   */
  async updateCurrentDevice(updates: Partial<DeviceInfo>): Promise<DeviceInfo | null> {
    const currentDevice = this.getCurrentDevice();
    if (!currentDevice) {
      throw new Error('No current device found');
    }

    const updatedDevice: DeviceInfo = {
      ...currentDevice,
      ...updates,
      lastSeen: new Date()
    };

    try {
      // Update device in user's device list
      await this.userAuth.updateDevice(updatedDevice);
      
      // Update local storage
      localStorage.setItem('current-device', JSON.stringify(updatedDevice));
      
      console.log('✅ Device updated:', updatedDevice);
      return updatedDevice;
    } catch (error) {
      console.error('Failed to update device:', error);
      throw new Error('Device update failed');
    }
  }

  /**
   * Get all devices for current user
   */
  async getUserDevices(): Promise<DeviceInfo[]> {
    try {
      return await this.userAuth.getUserDevices();
    } catch (error) {
      console.error('Failed to get user devices:', error);
      return [];
    }
  }

  /**
   * Remove a device from user account
   */
  async removeDevice(deviceId: string): Promise<void> {
    try {
      await this.userAuth.removeDevice(deviceId);
      
      // If removing current device, clear local data
      if (deviceId === this.currentDeviceId) {
        this.clearCurrentDevice();
      }
      
      console.log('🗑️ Device removed:', deviceId);
    } catch (error) {
      console.error('Failed to remove device:', error);
      throw new Error('Device removal failed');
    }
  }

  /**
   * Rename a device
   */
  async renameDevice(deviceId: string, newName: string): Promise<void> {
    if (!newName.trim()) {
      throw new Error('Device name cannot be empty');
    }

    try {
      const devices = await this.getUserDevices();
      const device = devices.find(d => d.id === deviceId);
      
      if (!device) {
        throw new Error('Device not found');
      }

      const updatedDevice: DeviceInfo = {
        ...device,
        name: newName.trim(),
        lastSeen: new Date()
      };

      await this.userAuth.updateDevice(updatedDevice);

      // If this is the current device, update local storage
      if (deviceId === this.currentDeviceId) {
        localStorage.setItem('current-device', JSON.stringify(updatedDevice));
      }

      console.log('✅ Device renamed:', deviceId, '->', newName);
    } catch (error) {
      console.error('Failed to rename device:', error);
      throw new Error('Device rename failed');
    }
  }

  /**
   * Check if current device is registered
   */
  isCurrentDeviceRegistered(): boolean {
    return this.getCurrentDevice() !== null;
  }

  /**
   * Clear current device data (for logout)
   */
  clearCurrentDevice(): void {
    localStorage.removeItem('current-device');
    console.log('🗑️ Cleared current device data');
  }

  /**
   * Get device synchronization status
   */
  async getDeviceSyncStatus(deviceId?: string): Promise<{
    lastSync: number | null;
    syncInProgress: boolean;
    errors: string[];
  }> {
    const targetDeviceId = deviceId || this.currentDeviceId;
    
    if (!targetDeviceId) {
      return { lastSync: null, syncInProgress: false, errors: ['No device ID'] };
    }

    try {
      // Get sync status from storage or sync service
      const syncStatus = localStorage.getItem(`sync-status-${targetDeviceId}`);
      
      if (syncStatus) {
        return JSON.parse(syncStatus);
      }
      
      return { lastSync: null, syncInProgress: false, errors: [] };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { lastSync: null, syncInProgress: false, errors: ['Status check failed'] };
    }
  }

  private generateDeviceId(): string {
    // Generate a unique device ID using timestamp and random values
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `device_${timestamp}_${random}`;
  }

  private getDefaultDeviceName(): string {
    const platform = this.getPlatform();
    const deviceType = this.getDeviceType();
    
    // Create a friendly default name
    const platformNames: Record<string, string> = {
      'windows': 'Windows PC',
      'macos': 'Mac',
      'linux': 'Linux PC',
      'ios': 'iPhone',
      'android': 'Android',
      'unknown': 'Device'
    };

    const typeSuffix = deviceType === 'mobile' ? '' : ' Computer';
    return `${platformNames[platform] || 'Device'}${typeSuffix}`;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod/.test(userAgent)) {
      return 'mobile';
    }
    
    if (/ipad|tablet/.test(userAgent)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/windows/.test(userAgent)) return 'windows';
    if (/macintosh|mac os/.test(userAgent)) return 'macos';
    if (/linux/.test(userAgent)) return 'linux';
    if (/iphone|ipod|ipad/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    
    return 'unknown';
  }
}