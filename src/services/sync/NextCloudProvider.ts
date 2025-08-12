/**
 * NextCloud WebDAV Provider
 * 
 * Implements cloud sync through NextCloud's WebDAV interface.
 * Provides maximum privacy and user control over data storage.
 */

import { BaseCloudProvider } from './CloudProvider';
import { NextCloudConfig, EncryptedData, FileMetadata, StorageInfo } from '../../types/sync';

export class NextCloudProvider extends BaseCloudProvider {
  readonly type = 'nextcloud' as const;
  private config: NextCloudConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: NextCloudConfig) {
    super();
    this.config = config;
    
    // Create basic auth header
    const credentials = btoa(`${config.username}:${config.appPassword}`);
    this.baseHeaders = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ScienceHabits/1.0'
    };
  }

  async authenticate(): Promise<boolean> {
    try {
      // Test authentication with a PROPFIND request to the sync directory
      const response = await this.retryOperation(() => 
        fetch(this.buildUrl(''), {
          method: 'PROPFIND',
          headers: {
            ...this.baseHeaders,
            'Depth': '0'
          }
        })
      );
      
      // NextCloud returns 207 Multi-Status for successful PROPFIND
      return response.status === 207 || response.status === 200;
    } catch (error) {
      console.error('NextCloud authentication failed:', error);
      return false;
    }
  }

  async uploadFile(path: string, data: EncryptedData): Promise<void> {
    if (!this.validateEncryptedData(data)) {
      throw new Error('Invalid encrypted data format');
    }

    const url = this.buildUrl(path);
    const fileContent = JSON.stringify(data);
    
    try {
      await this.retryOperation(async () => {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            ...this.baseHeaders,
            'Content-Type': 'application/json',
            'Content-Length': fileContent.length.toString()
          },
          body: fileContent
        });
        
        if (!response.ok) {
          throw this.handleNetworkError(response, 'File upload');
        }
        
        return response;
      });
      
      console.log(`✅ Uploaded to NextCloud: ${path}`);
    } catch (error) {
      throw this.handleNetworkError(error, 'File upload');
    }
  }

  async downloadFile(path: string): Promise<EncryptedData> {
    const url = this.buildUrl(path);
    
    try {
      const response = await this.retryOperation(async () => {
        const res = await fetch(url, {
          method: 'GET',
          headers: this.baseHeaders
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
      
      console.log(`✅ Downloaded from NextCloud: ${path}`);
      return data;
    } catch (error) {
      throw this.handleNetworkError(error, 'File download');
    }
  }

  async listFiles(directory: string): Promise<FileMetadata[]> {
    const url = this.buildUrl(directory);
    
    try {
      const response = await this.retryOperation(async () => {
        const res = await fetch(url, {
          method: 'PROPFIND',
          headers: {
            ...this.baseHeaders,
            'Depth': '1',
            'Content-Type': 'application/xml'
          },
          body: `<?xml version="1.0"?>
            <d:propfind xmlns:d="DAV:">
              <d:prop>
                <d:displayname/>
                <d:getcontentlength/>
                <d:getlastmodified/>
                <d:getetag/>
                <d:resourcetype/>
              </d:prop>
            </d:propfind>`
        });
        
        if (!res.ok) {
          throw this.handleNetworkError(res, 'Directory listing');
        }
        
        return res;
      });
      
      const xmlText = await response.text();
      const files = this.parseWebDAVResponse(xmlText, directory);
      
      console.log(`✅ Listed ${files.length} files from NextCloud: ${directory}`);
      return files;
    } catch (error) {
      throw this.handleNetworkError(error, 'Directory listing');
    }
  }

  async deleteFile(path: string): Promise<void> {
    const url = this.buildUrl(path);
    
    try {
      await this.retryOperation(async () => {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: this.baseHeaders
        });
        
        if (!response.ok && response.status !== 404) {
          throw this.handleNetworkError(response, 'File deletion');
        }
        
        return response;
      });
      
      console.log(`✅ Deleted from NextCloud: ${path}`);
    } catch (error) {
      throw this.handleNetworkError(error, 'File deletion');
    }
  }

  async getServerTimestamp(file: string): Promise<number> {
    try {
      const files = await this.listFiles('');
      const fileInfo = files.find(f => f.name === file);
      return fileInfo?.modified || 0;
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
      // Quick connectivity test with minimal data transfer
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(this.buildUrl(''), {
        method: 'HEAD',
        headers: this.baseHeaders,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok || response.status === 404; // 404 is fine, means we can reach the server
    } catch (error) {
      console.error('NextCloud connection test failed:', error);
      return false;
    }
  }

  async getStorageQuota(): Promise<StorageInfo> {
    try {
      // Use NextCloud's quota info from WebDAV properties
      const response = await this.retryOperation(async () => {
        const res = await fetch(this.buildUrl(''), {
          method: 'PROPFIND',
          headers: {
            ...this.baseHeaders,
            'Depth': '0',
            'Content-Type': 'application/xml'
          },
          body: `<?xml version="1.0"?>
            <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
              <d:prop>
                <d:quota-available-bytes/>
                <d:quota-used-bytes/>
                <oc:quota-available/>
                <oc:quota-used/>
              </d:prop>
            </d:propfind>`
        });
        
        if (!res.ok) {
          throw this.handleNetworkError(res, 'Quota check');
        }
        
        return res;
      });
      
      const xmlText = await response.text();
      return this.parseQuotaResponse(xmlText);
    } catch (error) {
      console.error('Failed to get NextCloud quota:', error);
      // Return unknown quota if we can't determine it
      return {
        used: 0,
        available: null,
        percentage: null
      };
    }
  }

  private buildUrl(path: string): string {
    const cleanPath = this.sanitizePath(path);
    const syncPath = this.sanitizePath(this.config.syncPath);
    const fullPath = cleanPath ? `${syncPath}/${cleanPath}` : syncPath;
    
    // Build WebDAV URL
    const baseUrl = this.config.serverUrl.replace(/\/+$/, ''); // Remove trailing slashes
    return `${baseUrl}/remote.php/dav/files/${this.config.username}/${fullPath}`;
  }

  private parseWebDAVResponse(xmlText: string, basePath: string): FileMetadata[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const responses = doc.querySelectorAll('d\\:response, response');
      const files: FileMetadata[] = [];
      
      for (const response of responses) {
        const href = response.querySelector('d\\:href, href')?.textContent || '';
        const props = response.querySelector('d\\:propstat d\\:prop, propstat prop');
        
        if (!props) continue;
        
        // Check if this is a file (not a directory)
        const resourceType = props.querySelector('d\\:resourcetype, resourcetype');
        const isCollection = resourceType?.querySelector('d\\:collection, collection');
        if (isCollection) continue; // Skip directories
        
        // Extract file information
        const displayName = props.querySelector('d\\:displayname, displayname')?.textContent || '';
        const contentLength = props.querySelector('d\\:getcontentlength, getcontentlength')?.textContent || '0';
        const lastModified = props.querySelector('d\\:getlastmodified, getlastmodified')?.textContent || '';
        const etag = props.querySelector('d\\:getetag, getetag')?.textContent || '';
        
        if (displayName && displayName.endsWith('.enc')) {
          const fileName = displayName.replace(/\.enc$/, '');
          files.push(this.createFileMetadata(
            fileName,
            parseInt(contentLength, 10),
            new Date(lastModified),
            etag.replace(/['"]/g, '') // Remove quotes from etag
          ));
        }
      }
      
      return files;
    } catch (error) {
      console.error('Failed to parse WebDAV response:', error);
      return [];
    }
  }

  private parseQuotaResponse(xmlText: string): StorageInfo {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      
      const quotaUsed = doc.querySelector('d\\:quota-used-bytes, quota-used-bytes, oc\\:quota-used, quota-used')?.textContent;
      const quotaAvailable = doc.querySelector('d\\:quota-available-bytes, quota-available-bytes, oc\\:quota-available, quota-available')?.textContent;
      
      const used = quotaUsed ? parseInt(quotaUsed, 10) : 0;
      const available = quotaAvailable ? parseInt(quotaAvailable, 10) : null;
      
      let percentage = null;
      if (available && available > 0) {
        percentage = (used / (used + available)) * 100;
      }
      
      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to parse quota response:', error);
      return { used: 0, available: null, percentage: null };
    }
  }
}