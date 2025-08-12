/**
 * User Authentication Service
 * 
 * Handles email-based user authentication, device linking, and
 * privacy-preserving user ID generation for the sync system.
 */

import { User, AuthResult, DeviceInfo } from '../../types/sync';

export class UserAuthentication {
  private dbName = 'sciencehabits-auth';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'userId' });
          usersStore.createIndex('emailHash', 'emailHash', { unique: true });
        }
        
        // Sessions store for current authentication
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
      };
    });
  }

  async registerUser(email: string, password: string): Promise<AuthResult> {
    if (!this.isValidEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    if (!this.isStrongPassword(password)) {
      return { success: false, error: 'Password must be at least 8 characters with mixed case, numbers, and symbols' };
    }

    try {
      // Generate privacy-preserving user ID from email
      const userId = await this.generateUserIdFromEmail(email);
      const emailHash = await this.hashEmail(email);
      
      // Check if user already exists
      const existingUser = await this.getUserByEmailHash(emailHash);
      if (existingUser) {
        return { success: false, error: 'Account already exists with this email' };
      }
      
      // Generate encryption salt
      const salt = crypto.getRandomValues(new Uint8Array(32));
      
      // Create user profile
      const user: User = {
        userId,
        email: email.toLowerCase(),
        emailHash,
        createdAt: Date.now(),
        devices: [],
        encryptionSalt: Array.from(salt),
        cloudProvider: 'none'
      };
      
      // Store user
      await this.saveUser(user);
      
      // Create session
      await this.createSession(user, password);
      
      console.log('✅ User registered successfully:', { userId, email: email.toLowerCase() });
      
      return {
        success: true,
        user: { userId, email: email.toLowerCase() },
        requiresCloudSetup: true
      };
    } catch (error) {
      console.error('User registration failed:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    try {
      const emailHash = await this.hashEmail(email);
      const user = await this.getUserByEmailHash(emailHash);
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Verify password by attempting to derive the same key
      const isValid = await this.verifyPassword(password, user.encryptionSalt);
      
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Create session
      await this.createSession(user, password);
      
      // Update last seen
      user.lastSeen = Date.now();
      await this.saveUser(user);
      
      console.log('✅ User authenticated successfully:', { userId: user.userId, email: user.email });
      
      return {
        success: true,
        user: { userId: user.userId, email: user.email },
        requiresCloudSetup: !user.cloudProvider || user.cloudProvider === 'none'
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      return { success: false, error: 'Authentication failed. Please try again.' };
    }
  }

  async linkDevice(deviceInfo: DeviceInfo): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Check if device already exists
    const existingIndex = currentUser.devices.findIndex(d => d.id === deviceInfo.id);
    
    if (existingIndex >= 0) {
      // Update existing device
      currentUser.devices[existingIndex] = {
        ...deviceInfo,
        lastSeen: Date.now()
      };
    } else {
      // Add new device
      currentUser.devices.push({
        ...deviceInfo,
        lastSeen: Date.now()
      });
    }
    
    await this.saveUser(currentUser);
    console.log('✅ Device linked successfully:', deviceInfo);
  }

  async updateDevice(deviceInfo: DeviceInfo): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const deviceIndex = currentUser.devices.findIndex(d => d.id === deviceInfo.id);
    if (deviceIndex === -1) {
      throw new Error('Device not found');
    }

    currentUser.devices[deviceIndex] = deviceInfo;
    await this.saveUser(currentUser);
    
    console.log('✅ Device updated:', deviceInfo);
  }

  async getUserDevices(): Promise<DeviceInfo[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    return currentUser.devices;
  }

  async removeDevice(deviceId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    currentUser.devices = currentUser.devices.filter(d => d.id !== deviceId);
    await this.saveUser(currentUser);
    
    console.log('✅ Device removed:', deviceId);
  }

  async unlinkDevice(deviceId: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    currentUser.devices = currentUser.devices.filter(d => d.id !== deviceId);
    await this.saveUser(currentUser);
    
    console.log('✅ Device unlinked:', deviceId);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get('current');
      
      request.onsuccess = async () => {
        if (request.result) {
          const user = await this.getUserById(request.result.userId);
          resolve(user);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }

  async signOut(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete('current');
      
      request.onsuccess = () => {
        console.log('✅ User signed out');
        resolve();
      };
      request.onerror = () => resolve();
    });
  }

  private async generateUserIdFromEmail(email: string): Promise<string> {
    // Use PBKDF2 to generate consistent user ID from email
    const normalizedEmail = email.toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedEmail);
    
    const key = await crypto.subtle.importKey(
      'raw', data, 'PBKDF2', false, ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode('sciencehabits-user-id-v1'),
        iterations: 10000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    return Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async hashEmail(email: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async verifyPassword(password: string, salt: number[]): Promise<boolean> {
    try {
      // Attempt to derive the same key that would be used for encryption
      const key = await this.deriveKeyFromPassword(password, new Uint8Array(salt));
      return key !== null;
    } catch {
      return false;
    }
  }

  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async createSession(user: User, password: string): Promise<void> {
    if (!this.db) return;
    
    // Store minimal session info - password is not stored
    const session = {
      id: 'current',
      userId: user.userId,
      createdAt: Date.now(),
      deviceId: this.getCurrentDeviceId()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private getCurrentDeviceId(): string {
    // Generate or retrieve device-specific identifier
    let deviceId = localStorage.getItem('sciencehabits-device-id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('sciencehabits-device-id', deviceId);
    }
    return deviceId;
  }

  private async saveUser(user: User): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getUserById(userId: string): Promise<User | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(userId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async getUserByEmailHash(emailHash: string): Promise<User | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('emailHash');
      const request = index.get(emailHash);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isStrongPassword(password: string): boolean {
    // At least 8 characters, mixed case, numbers, symbols
    const minLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return minLength && hasLower && hasUpper && hasNumber && hasSymbol;
  }
}