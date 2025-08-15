/**
 * Google Drive Provider - Simplified Sync Integration
 * 
 * Provides simple "Sign in with Google" sync using Google Drive API.
 * No complex setup required - just standard Google OAuth flow.
 */

import { BaseCloudProvider } from './CloudProvider';
import { EncryptedData, FileMetadata, StorageInfo, CloudConfig } from '../../types/sync';

interface GoogleDriveFile {
  id: string;
  name: string;
  size?: string;
  modifiedTime: string;
  parents?: string[];
}

export class GoogleDriveProvider extends BaseCloudProvider {
  readonly type = 'google-drive' as const;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private appFolderId: string | null = null;
  
  // Google Drive API scopes - only file access, not full Drive access
  static readonly SCOPES = [
    'https://www.googleapis.com/auth/drive.file' // Only access files created by this app
  ];
  
  static readonly DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
  ];

  constructor(config?: CloudConfig) {
    super();
  }

  async authenticate(): Promise<boolean> {
    try {
      // Check if we have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
        return true;
      }

      // Initialize Google API client if not already done
      if (!window.gapi) {
        throw new Error('Google API client not loaded');
      }

      await this.initializeGoogleAPI();
      
      // Try to get existing auth
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        await this.updateTokenFromAuth(authInstance);
        return true;
      }

      // Need to sign in
      const user = await authInstance.signIn();
      await this.updateTokenFromAuth(authInstance);
      
      console.log('✅ Google Drive authentication successful');
      return true;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.accessToken = null;
      this.tokenExpiry = 0;
      this.appFolderId = null;
      console.log('✅ Signed out from Google Drive');
    } catch (error) {
      console.error('Google Drive sign out failed:', error);
    }
  }

  async uploadFile(path: string, data: EncryptedData): Promise<void> {
    if (!this.validateEncryptedData(data)) {
      throw new Error('Invalid encrypted data format');
    }

    await this.ensureValidToken();
    await this.ensureAppFolder();

    const fileName = `${this.sanitizePath(path)}.enc`;
    const fileContent = JSON.stringify(data);
    
    try {
      // Check if file already exists
      const existingFile = await this.findFileByName(fileName);
      
      const metadata = {
        name: fileName,
        parents: [this.appFolderId!],
        description: 'ScienceHabits encrypted data'
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      const url = existingFile 
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

      const response = await fetch(url, {
        method: existingFile ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ ${existingFile ? 'Updated' : 'Uploaded'} to Google Drive: ${path}`);
    } catch (error) {
      throw new Error(`Failed to upload file to Google Drive: ${error}`);
    }
  }

  async downloadFile(path: string): Promise<EncryptedData> {
    await this.ensureValidToken();
    await this.ensureAppFolder();

    const fileName = `${this.sanitizePath(path)}.enc`;
    
    try {
      const file = await this.findFileByName(fileName);
      if (!file) {
        throw new Error(`File not found: ${path}`);
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      const data: EncryptedData = JSON.parse(content);

      if (!this.validateEncryptedData(data)) {
        throw new Error('Downloaded file contains invalid encrypted data');
      }

      console.log(`✅ Downloaded from Google Drive: ${path}`);
      return data;
    } catch (error) {
      throw new Error(`Failed to download file from Google Drive: ${error}`);
    }
  }

  async listFiles(directory: string = ''): Promise<FileMetadata[]> {
    await this.ensureValidToken();
    await this.ensureAppFolder();

    try {
      const query = `'${this.appFolderId}' in parents and name contains '.enc' and trashed=false`;
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,modifiedTime)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`List files failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const files: FileMetadata[] = [];

      for (const file of data.files || []) {
        const name = file.name.replace(/\.enc$/, '');
        if (name && (!directory || name.startsWith(directory))) {
          files.push(this.createFileMetadata(
            name,
            parseInt(file.size || '0', 10),
            new Date(file.modifiedTime),
            file.id
          ));
        }
      }

      console.log(`✅ Listed ${files.length} files from Google Drive: ${directory}`);
      return files;
    } catch (error) {
      throw new Error(`Failed to list files from Google Drive: ${error}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    await this.ensureValidToken();
    await this.ensureAppFolder();

    const fileName = `${this.sanitizePath(path)}.enc`;
    
    try {
      const file = await this.findFileByName(fileName);
      if (!file) {
        console.log(`File not found for deletion: ${path}`);
        return;
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ Deleted from Google Drive: ${path}`);
    } catch (error) {
      throw new Error(`Failed to delete file from Google Drive: ${error}`);
    }
  }

  async getServerTimestamp(file: string): Promise<number> {
    try {
      await this.ensureValidToken();
      await this.ensureAppFolder();

      const fileName = `${this.sanitizePath(file)}.enc`;
      const driveFile = await this.findFileByName(fileName);
      
      if (!driveFile) {
        return 0;
      }

      return new Date(driveFile.modifiedTime).getTime();
    } catch (error) {
      console.error('Failed to get server timestamp:', error);
      return 0;
    }
  }

  async checkConnection(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      await this.ensureValidToken();
      
      // Quick connectivity test to Google Drive API
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Google Drive connection test failed:', error);
      return false;
    }
  }

  async getStorageQuota(): Promise<StorageInfo> {
    try {
      await this.ensureValidToken();
      
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get storage quota');
      }

      const data = await response.json();
      const quota = data.storageQuota;

      const used = parseInt(quota.usage || '0', 10);
      const total = parseInt(quota.limit || '0', 10);

      return {
        used,
        available: total > 0 ? total - used : null,
        percentage: total > 0 ? (used / total) * 100 : null
      };
    } catch (error) {
      console.error('Failed to get Google Drive quota:', error);
      return {
        used: 0,
        available: null,
        percentage: null
      };
    }
  }

  // Private helper methods

  private async initializeGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('Google API not loaded'));
        return;
      }

      window.gapi.load('auth2:client', async () => {
        try {
          // Use a default client ID for testing, can be overridden
          const CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID || 
                           '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';

          await window.gapi.client.init({
            clientId: CLIENT_ID,
            scope: GoogleDriveProvider.SCOPES.join(' '),
            discoveryDocs: GoogleDriveProvider.DISCOVERY_DOCS
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async updateTokenFromAuth(authInstance: any): Promise<void> {
    const user = authInstance.currentUser.get();
    const authResponse = user.getAuthResponse();
    
    this.accessToken = authResponse.access_token;
    this.tokenExpiry = authResponse.expires_at;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Failed to authenticate with Google Drive');
      }
    }
  }

  private async ensureAppFolder(): Promise<void> {
    if (this.appFolderId) {
      return;
    }

    try {
      // Search for existing ScienceHabits folder
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='ScienceHabits' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to search for app folder');
      }

      const searchData = await searchResponse.json();
      
      if (searchData.files && searchData.files.length > 0) {
        this.appFolderId = searchData.files[0].id;
        console.log('✅ Found existing ScienceHabits folder');
        return;
      }

      // Create the folder
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'ScienceHabits',
          mimeType: 'application/vnd.google-apps.folder',
          description: 'ScienceHabits app data folder - contains encrypted habit tracking data'
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create app folder');
      }

      const createData = await createResponse.json();
      this.appFolderId = createData.id;
      console.log('✅ Created ScienceHabits folder in Google Drive');
    } catch (error) {
      throw new Error(`Failed to ensure app folder: ${error}`);
    }
  }

  private async findFileByName(fileName: string): Promise<GoogleDriveFile | null> {
    try {
      const query = `name='${fileName}' and '${this.appFolderId}' in parents and trashed=false`;
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,size,modifiedTime)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0] : null;
    } catch (error) {
      console.error('Failed to find file by name:', error);
      return null;
    }
  }
}

// Google Drive Authentication helper for browser-based sign-in
export class GoogleDriveAuth {
  static async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.gapi) {
        resolve();
        return;
      }

      // Load Google API
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      
      document.head.appendChild(script);
    });
  }

  static async initializeAuth(clientId?: string): Promise<void> {
    await this.loadGoogleAPI();
    
    return new Promise((resolve, reject) => {
      window.gapi.load('auth2:client', async () => {
        try {
          const defaultClientId = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID || 
                                 '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';

          await window.gapi.client.init({
            clientId: clientId || defaultClientId,
            scope: GoogleDriveProvider.SCOPES.join(' '),
            discoveryDocs: GoogleDriveProvider.DISCOVERY_DOCS
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  static async signIn(): Promise<boolean> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Google Auth not initialized');
      }

      if (authInstance.isSignedIn.get()) {
        return true;
      }

      await authInstance.signIn();
      return true;
    } catch (error) {
      console.error('Google Drive sign in failed:', error);
      return false;
    }
  }

  static async signOut(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance && authInstance.isSignedIn.get()) {
        await authInstance.signOut();
      }
    } catch (error) {
      console.error('Google Drive sign out failed:', error);
    }
  }

  static isSignedIn(): boolean {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      return authInstance ? authInstance.isSignedIn.get() : false;
    } catch (error) {
      return false;
    }
  }

  static getCurrentUser(): any {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      return authInstance ? authInstance.currentUser.get() : null;
    } catch (error) {
      return null;
    }
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}