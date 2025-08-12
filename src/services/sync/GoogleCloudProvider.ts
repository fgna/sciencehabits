/**
 * Google Cloud Storage Provider
 * 
 * Implements cloud sync through Google Cloud Storage using the user's
 * existing Google Cloud project. Provides convenience and global availability.
 */

import { BaseCloudProvider } from './CloudProvider';
import { GoogleCloudConfig, EncryptedData, FileMetadata, StorageInfo } from '../../types/sync';

export class GoogleCloudProvider extends BaseCloudProvider {
  readonly type = 'google-cloud' as const;
  private config: GoogleCloudConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: GoogleCloudConfig) {
    super();
    this.config = config;
  }

  async authenticate(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      
      // Test access by checking if bucket exists
      const response = await this.retryOperation(async () => {
        const headers = await this.getAuthHeaders();
        return fetch(this.buildUrl(''), {
          method: 'HEAD',
          headers
        });
      });
      
      return response.ok;
    } catch (error) {
      console.error('Google Cloud authentication failed:', error);
      return false;
    }
  }

  async uploadFile(path: string, data: EncryptedData): Promise<void> {
    if (!this.validateEncryptedData(data)) {
      throw new Error('Invalid encrypted data format');
    }

    await this.ensureValidToken();
    
    const url = this.buildUrl(`sciencehabits/${this.sanitizePath(path)}.enc`);
    const fileContent = JSON.stringify(data);
    
    try {
      await this.retryOperation(async () => {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            ...await this.getAuthHeaders(),
            'Content-Type': 'application/json',
            'Content-Length': fileContent.length.toString(),
            'x-goog-meta-encrypted': 'true',
            'x-goog-meta-version': data.version,
            'x-goog-meta-timestamp': data.timestamp.toString()
          },
          body: fileContent
        });
        
        if (!response.ok) {
          throw this.handleNetworkError(response, 'File upload');
        }
        
        return response;
      });
      
      console.log(`✅ Uploaded to Google Cloud: ${path}`);
    } catch (error) {
      throw this.handleNetworkError(error, 'File upload');
    }
  }

  async downloadFile(path: string): Promise<EncryptedData> {
    await this.ensureValidToken();
    
    const url = this.buildUrl(`sciencehabits/${this.sanitizePath(path)}.enc`);
    
    try {
      const response = await this.retryOperation(async () => {
        const res = await fetch(url, {
          method: 'GET',
          headers: await this.getAuthHeaders()
        });
        
        if (!res.ok) {
          throw this.handleNetworkError(res, 'File download');
        }
        
        return res;
      });
      
      const content = await response.text();
      const data: EncryptedData = JSON.parse(content);
      
      if (!this.validateEncryptedData(data)) {
        throw new Error('Downloaded file contains invalid encrypted data');
      }
      
      console.log(`✅ Downloaded from Google Cloud: ${path}`);
      return data;
    } catch (error) {
      throw this.handleNetworkError(error, 'File download');
    }
  }

  async listFiles(directory: string): Promise<FileMetadata[]> {
    await this.ensureValidToken();
    
    const prefix = directory ? `sciencehabits/${this.sanitizePath(directory)}/` : 'sciencehabits/';
    const url = `${this.buildUrl('')}?prefix=${encodeURIComponent(prefix)}&delimiter=/`;
    
    try {
      const response = await this.retryOperation(async () => {
        const res = await fetch(url, {
          method: 'GET',
          headers: await this.getAuthHeaders()
        });
        
        if (!res.ok) {
          throw this.handleNetworkError(res, 'Directory listing');
        }
        
        return res;
      });
      
      const data = await response.json();
      const files = this.parseListResponse(data, prefix);
      
      console.log(`✅ Listed ${files.length} files from Google Cloud: ${directory}`);
      return files;
    } catch (error) {
      throw this.handleNetworkError(error, 'Directory listing');
    }
  }

  async deleteFile(path: string): Promise<void> {
    await this.ensureValidToken();
    
    const url = this.buildUrl(`sciencehabits/${this.sanitizePath(path)}.enc`);
    
    try {
      await this.retryOperation(async () => {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: await this.getAuthHeaders()
        });
        
        if (!response.ok && response.status !== 404) {
          throw this.handleNetworkError(response, 'File deletion');
        }
        
        return response;
      });
      
      console.log(`✅ Deleted from Google Cloud: ${path}`);
    } catch (error) {
      throw this.handleNetworkError(error, 'File deletion');
    }
  }

  async getServerTimestamp(file: string): Promise<number> {
    try {
      await this.ensureValidToken();
      
      const url = this.buildUrl(`sciencehabits/${this.sanitizePath(file)}.enc`);
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: await this.getAuthHeaders()
      });
      
      if (!response.ok) {
        return 0;
      }
      
      const updated = response.headers.get('x-goog-meta-timestamp');
      return updated ? parseInt(updated, 10) : 0;
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
      
      // Quick connectivity test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(this.buildUrl(''), {
        method: 'HEAD',
        headers: await this.getAuthHeaders(),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok || response.status === 404;
    } catch (error) {
      console.error('Google Cloud connection test failed:', error);
      return false;
    }
  }

  async getStorageQuota(): Promise<StorageInfo> {
    try {
      await this.ensureValidToken();
      
      // List all files to calculate usage
      const response = await this.retryOperation(async () => {
        const res = await fetch(`${this.buildUrl('')}?prefix=sciencehabits/`, {
          method: 'GET',
          headers: await this.getAuthHeaders()
        });
        
        if (!res.ok) {
          throw this.handleNetworkError(res, 'Usage check');
        }
        
        return res;
      });
      
      const data = await response.json();
      const totalSize = data.items?.reduce((sum: number, item: any) => 
        sum + parseInt(item.size || '0', 10), 0) || 0;
      
      return {
        used: totalSize,
        available: null, // User manages their own quota
        percentage: null // No artificial limits
      };
    } catch (error) {
      console.error('Failed to get Google Cloud quota:', error);
      return {
        used: 0,
        available: null,
        percentage: null
      };
    }
  }

  private buildUrl(path: string): string {
    const cleanPath = this.sanitizePath(path);
    const url = `https://storage.googleapis.com/storage/v1/b/${this.config.bucketName}/o`;
    return cleanPath ? `${url}/${encodeURIComponent(cleanPath)}` : url;
  }

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    
    if (this.accessToken && now < this.tokenExpiry - 60000) { // Refresh 1 minute early
      return;
    }
    
    if (this.config.credentials.type === 'oauth2') {
      await this.refreshOAuth2Token();
    } else {
      throw new Error('Service account authentication not yet implemented for browser');
    }
  }

  private async refreshOAuth2Token(): Promise<void> {
    if (!this.config.credentials.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.credentials.clientId || '',
        client_secret: this.config.credentials.clientSecret || '',
        refresh_token: this.config.credentials.refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh Google Cloud access token');
    }
    
    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    console.log('✅ Refreshed Google Cloud access token');
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'User-Agent': 'ScienceHabits/1.0'
    };
  }

  private parseListResponse(data: any, prefix: string): FileMetadata[] {
    const files: FileMetadata[] = [];
    
    if (!data.items) {
      return files;
    }
    
    for (const item of data.items) {
      const name = item.name;
      
      // Skip directories and non-encrypted files
      if (name.endsWith('/') || !name.endsWith('.enc')) {
        continue;
      }
      
      // Remove prefix and .enc suffix
      const relativeName = name.replace(prefix, '').replace(/\.enc$/, '');
      
      if (relativeName) {
        files.push(this.createFileMetadata(
          relativeName,
          parseInt(item.size || '0', 10),
          new Date(item.updated || item.timeCreated),
          item.etag
        ));
      }
    }
    
    return files;
  }
}

// Google Cloud OAuth2 helper for browser-based authentication
export class GoogleCloudAuth {
  private clientId: string;
  private redirectUri: string;
  private scopes = ['https://www.googleapis.com/auth/cloud-platform'];

  constructor(clientId: string, redirectUri: string) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCodeForTokens(code: string, clientSecret: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }
}