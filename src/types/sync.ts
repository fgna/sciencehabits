/**
 * Sync Types - MVP Stubs
 * 
 * MVP: Cloud sync functionality disabled for MVP.
 * These are placeholder types to keep existing code compiling.
 */

// Device Management Types
export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  platform: string;
  lastSeen: Date;
  isActive: boolean;
  isCurrentDevice?: boolean;
  userAgent?: string;
  createdAt?: Date;
}

// Cloud Provider Types
export type CloudProviderType = 'google-drive' | 'nextcloud' | 'google-cloud';

export interface CloudConfig {
  type: CloudProviderType;
  enabled: boolean;
  // Provider-specific config - all optional for MVP stubs
  serverUrl?: string;
  username?: string;
  appPassword?: string;
  syncPath?: string;
  projectId?: string;
  bucketName?: string;
  region?: string;
  credentials?: any;
}

// Sync Status Types
export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  errorCount: number;
}

// User Authentication Types
export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
  deviceId?: string;
}

export interface UserCredentials {
  username: string;
  password: string;
  email?: string;
  rememberDevice?: boolean;
}

// User Registration Types
export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences?: Record<string, any>;
  // Auth system properties (MVP: kept for compatibility)
  emailHash?: string;
  devices?: DeviceInfo[];
  encryptionSalt?: number[];
  cloudProvider?: string;
  lastSeen?: Date;
}

// MVP: All functionality disabled - these are just type stubs
export const MVP_SYNC_DISABLED = true;