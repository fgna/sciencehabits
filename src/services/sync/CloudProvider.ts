/**
 * Abstract Cloud Provider Interface
 * 
 * Defines the common interface for all cloud storage providers
 * (NextCloud, Google Cloud Storage, future providers).
 */

import { CloudProvider, FileMetadata, StorageInfo, EncryptedData, CloudProviderType } from '../../types/sync';

export abstract class BaseCloudProvider implements CloudProvider {
  abstract readonly type: CloudProviderType;
  
  // Core methods that must be implemented by each provider
  abstract authenticate(): Promise<boolean>;
  abstract uploadFile(path: string, data: EncryptedData): Promise<void>;
  abstract downloadFile(path: string): Promise<EncryptedData>;
  abstract listFiles(directory: string): Promise<FileMetadata[]>;
  abstract deleteFile(path: string): Promise<void>;
  abstract getServerTimestamp(file: string): Promise<number>;
  abstract checkConnection(): Promise<boolean>;
  abstract getStorageQuota(): Promise<StorageInfo>;
  
  // Common helper methods available to all providers
  protected sanitizePath(path: string): string {
    // Remove leading/trailing slashes and normalize path
    return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
  }
  
  protected validateEncryptedData(data: EncryptedData): boolean {
    return !!(
      data &&
      Array.isArray(data.data) &&
      Array.isArray(data.iv) &&
      typeof data.timestamp === 'number' &&
      typeof data.context === 'string' &&
      typeof data.version === 'string'
    );
  }
  
  protected createFileMetadata(name: string, size: number, modified: Date, etag?: string): FileMetadata {
    return {
      name: this.sanitizePath(name),
      size,
      modified: modified.getTime(),
      etag: etag || modified.getTime().toString()
    };
  }
  
  protected handleNetworkError(error: any, operation: string): Error {
    console.error(`${this.type} ${operation} failed:`, error);
    
    if (!navigator.onLine) {
      return new Error(`${operation} failed: No internet connection`);
    }
    
    if (error.name === 'AbortError') {
      return new Error(`${operation} was cancelled`);
    }
    
    if (error.status === 401 || error.status === 403) {
      return new Error(`${operation} failed: Authentication required`);
    }
    
    if (error.status === 404) {
      return new Error(`${operation} failed: File not found`);
    }
    
    if (error.status === 413) {
      return new Error(`${operation} failed: File too large`);
    }
    
    if (error.status === 507) {
      return new Error(`${operation} failed: Storage quota exceeded`);
    }
    
    return new Error(`${operation} failed: ${error.message || 'Unknown error'}`);
  }
  
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry authentication or client errors
        if (error instanceof Error && (
          error.message.includes('Authentication') ||
          error.message.includes('401') ||
          error.message.includes('403')
        )) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}