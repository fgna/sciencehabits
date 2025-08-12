/**
 * Sync System Types
 * 
 * Type definitions for the hybrid local-first sync architecture
 * supporting both NextCloud and Google Cloud providers.
 */

// User Authentication Types
export interface User {
  userId: string;
  email: string; // Hashed for privacy
  emailHash: string;
  createdAt: number;
  lastSeen?: number;
  devices: DeviceInfo[];
  encryptionSalt: number[];
  cloudProvider?: CloudProviderType;
  cloudConfig?: CloudConfig;
  lastSync?: number;
}

export interface AuthResult {
  success: boolean;
  user?: { userId: string; email: string };
  error?: string;
  requiresCloudSetup?: boolean;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  platform?: string;
  linkedAt?: number;
  createdAt?: number;
  lastSeen: number;
  userAgent?: string;
  isCurrentDevice?: boolean;
  isActive?: boolean;
}

// Cloud Provider Types
export type CloudProviderType = 'nextcloud' | 'google-cloud' | 'none';

export interface CloudConfig {
  type: CloudProviderType;
  serverUrl?: string; // NextCloud server URL
  username?: string; // NextCloud username
  appPassword?: string; // NextCloud app password
  syncPath?: string; // NextCloud sync path
  projectId?: string; // Google Cloud project ID
  bucketName?: string; // Google Cloud bucket
  region?: string; // Google Cloud region
  credentials?: any; // Provider-specific credentials
}

export interface NextCloudConfig extends CloudConfig {
  type: 'nextcloud';
  serverUrl: string;
  username: string;
  appPassword: string;
  syncPath: string;
}

export interface GoogleCloudConfig extends CloudConfig {
  type: 'google-cloud';
  projectId: string;
  bucketName: string;
  region: string;
  credentials: GoogleCredentials;
}

export interface GoogleCredentials {
  type: 'service_account' | 'oauth2';
  keyFile?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

// Sync Types
export interface SyncResult {
  status: 'success' | 'error' | 'offline' | 'conflicts';
  lastSync: number;
  filesUpdated?: number;
  conflictsResolved?: number;
  provider?: CloudProviderType;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  modified: number;
  etag: string;
}

export interface StorageInfo {
  used: number;
  available: number | null;
  percentage: number | null;
}

// Encryption Types
export interface EncryptedData {
  data: number[];
  iv: number[];
  timestamp: number;
  context: string;
  version: string;
}

export interface DataConflict {
  file: string;
  localVersion: any;
  serverVersion: any;
  localTimestamp: number;
  serverTimestamp: number;
  conflictType: 'timestamp' | 'structural' | 'concurrent';
}

// Cloud Provider Interface
export interface CloudProvider {
  readonly type: CloudProviderType;
  authenticate(): Promise<boolean>;
  uploadFile(path: string, data: EncryptedData): Promise<void>;
  downloadFile(path: string): Promise<EncryptedData>;
  listFiles(directory: string): Promise<FileMetadata[]>;
  deleteFile(path: string): Promise<void>;
  getServerTimestamp(file: string): Promise<number>;
  checkConnection(): Promise<boolean>;
  getStorageQuota(): Promise<StorageInfo>;
}

// Sync Service Interface
export interface SyncService {
  // Core storage layers
  cloudProvider: CloudProvider | null;
  
  // User management
  authenticateUser(email: string, password: string): Promise<AuthResult>;
  registerUser(email: string, password: string): Promise<AuthResult>;
  linkDevice(deviceInfo: DeviceInfo): Promise<void>;
  unlinkDevice(deviceId: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  
  // Cloud provider management
  setCloudProvider(config: CloudConfig): Promise<void>;
  switchProvider(newConfig: CloudConfig): Promise<void>;
  
  // Sync operations
  sync(): Promise<SyncResult>;
  push(): Promise<void>;
  pull(): Promise<void>;
  resolveConflicts(conflicts: DataConflict[]): Promise<void>;
  
  // Status
  isOnline(): boolean;
  getLastSyncTime(): number;
}