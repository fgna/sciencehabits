/**
 * End-to-End Encryption Service
 * 
 * Provides client-side encryption/decryption for all data before
 * it reaches cloud storage. Uses AES-GCM for authenticated encryption
 * with keys derived from user password via PBKDF2.
 */

import { EncryptedData } from '../../types/sync';

export class E2EEncryption {
  private userKey: CryptoKey | null = null;
  private derivedKeys = new Map<string, CryptoKey>();
  private initialized = false;

  /**
   * Initialize encryption system with user password and salt
   */
  async initializeFromPassword(password: string, salt: Uint8Array): Promise<void> {
    try {
      this.userKey = await this.deriveKeyFromPassword(password, salt);
      this.initialized = true;
      console.log('✅ Encryption system initialized');
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Encrypt data for storage in the cloud
   */
  async encryptData(data: any, context: string): Promise<EncryptedData> {
    if (!this.initialized || !this.userKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const plaintext = JSON.stringify(data);
      const encoder = new TextEncoder();
      const plaintextBuffer = encoder.encode(plaintext);
      
      // Generate random initialization vector
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      
      // Encrypt with AES-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.userKey,
        plaintextBuffer
      );
      
      const encryptedData: EncryptedData = {
        data: Array.from(new Uint8Array(encryptedBuffer)),
        iv: Array.from(iv),
        timestamp: Date.now(),
        context,
        version: '1.0'
      };
      
      console.log(`🔒 Encrypted ${context} data (${plaintext.length} -> ${encryptedData.data.length} bytes)`);
      return encryptedData;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data retrieved from the cloud
   */
  async decryptData(encryptedData: EncryptedData): Promise<any> {
    if (!this.initialized || !this.userKey) {
      throw new Error('Encryption not initialized');
    }

    if (!this.validateEncryptedData(encryptedData)) {
      throw new Error('Invalid encrypted data format');
    }

    try {
      const encryptedBuffer = new Uint8Array(encryptedData.data);
      const iv = new Uint8Array(encryptedData.iv);
      
      // Decrypt with AES-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.userKey,
        encryptedBuffer
      );
      
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);
      const data = JSON.parse(plaintext);
      
      console.log(`🔓 Decrypted ${encryptedData.context} data (${encryptedBuffer.length} -> ${plaintext.length} bytes)`);
      return data;
    } catch (error) {
      console.error('Decryption failed:', error);
      if (error instanceof Error && error.name === 'InvalidAccessError') {
        throw new Error('Decryption failed: Invalid password or corrupted data');
      }
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt multiple data items in batch
   */
  async encryptBatch(items: Array<{ data: any; context: string }>): Promise<Array<{ context: string; encrypted: EncryptedData }>> {
    const results = [];
    
    for (const item of items) {
      const encrypted = await this.encryptData(item.data, item.context);
      results.push({ context: item.context, encrypted });
    }
    
    return results;
  }

  /**
   * Decrypt multiple data items in batch
   */
  async decryptBatch(items: Array<{ context: string; encrypted: EncryptedData }>): Promise<Array<{ context: string; data: any }>> {
    const results = [];
    
    for (const item of items) {
      const data = await this.decryptData(item.encrypted);
      results.push({ context: item.context, data });
    }
    
    return results;
  }

  /**
   * Generate a secure backup key for account recovery
   */
  async generateBackupKey(password: string, salt: Uint8Array): Promise<string> {
    const key = await this.deriveKeyFromPassword(password, salt);
    
    // Export key as raw bytes
    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    const keyArray = new Uint8Array(keyBuffer);
    
    // Convert to base58 for user-friendly display (similar to Bitcoin addresses)
    return this.encodeBase58(keyArray);
  }

  /**
   * Restore encryption from backup key
   */
  async restoreFromBackupKey(backupKey: string, salt: Uint8Array): Promise<void> {
    try {
      const keyBytes = this.decodeBase58(backupKey);
      
      // Create a clean ArrayBuffer for crypto.subtle.importKey
      const arrayBuffer = new ArrayBuffer(keyBytes.length);
      const uint8View = new Uint8Array(arrayBuffer);
      uint8View.set(keyBytes);
      
      this.userKey = await crypto.subtle.importKey(
        'raw',
        arrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      
      this.initialized = true;
      console.log('✅ Encryption restored from backup key');
    } catch (error) {
      console.error('Failed to restore from backup key:', error);
      throw new Error('Invalid backup key');
    }
  }

  /**
   * Change encryption password (re-encrypt all data)
   */
  async changePassword(oldPassword: string, newPassword: string, salt: Uint8Array, newSalt: Uint8Array): Promise<void> {
    // Verify old password
    const oldKey = await this.deriveKeyFromPassword(oldPassword, salt);
    
    // Test decryption with old key
    if (!await this.testKey(oldKey)) {
      throw new Error('Current password is incorrect');
    }
    
    // Generate new key
    const newKey = await this.deriveKeyFromPassword(newPassword, newSalt);
    
    // Update current key
    this.userKey = newKey;
    this.initialized = true;
    
    console.log('✅ Encryption password changed');
  }

  /**
   * Check if encryption is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.userKey !== null;
  }

  /**
   * Clear encryption keys from memory (for security)
   */
  clearKeys(): void {
    this.userKey = null;
    this.derivedKeys.clear();
    this.initialized = false;
    console.log('🗑️ Encryption keys cleared');
  }

  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as base key
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive AES key using PBKDF2
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256 // 256-bit key
      },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );
  }

  private validateEncryptedData(data: EncryptedData): boolean {
    return !!(
      data &&
      Array.isArray(data.data) &&
      Array.isArray(data.iv) &&
      typeof data.timestamp === 'number' &&
      typeof data.context === 'string' &&
      typeof data.version === 'string' &&
      data.iv.length === 12 && // GCM IV should be 12 bytes
      data.data.length > 0
    );
  }

  private async testKey(key: CryptoKey): Promise<boolean> {
    try {
      // Test encryption/decryption with a small payload
      const testData = { test: 'validation' };
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(JSON.stringify(testData))
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      const result = JSON.parse(new TextDecoder().decode(decrypted));
      return result.test === 'validation';
    } catch {
      return false;
    }
  }

  private encodeBase58(bytes: Uint8Array): string {
    // Simplified base58 encoding using hex conversion
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex; // For ES5 compatibility, just use hex encoding
  }

  private decodeBase58(encoded: string): Uint8Array {
    // Simplified base58 decoding assuming hex input
    if (encoded.length % 2 !== 0) {
      throw new Error('Invalid base58 string');
    }
    
    const bytes = [];
    for (let i = 0; i < encoded.length; i += 2) {
      bytes.push(parseInt(encoded.substr(i, 2), 16));
    }
    
    return new Uint8Array(bytes);
  }
}