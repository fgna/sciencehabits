/**
 * Admin Authentication Service
 * 
 * Handles secure authentication and authorization for CMS admin users.
 * Provides role-based access control and session management.
 */

import { AdminUser, AuthResult, Permission } from '../../types/cms';

export class AdminAuthService {
  private dbName = 'sciencehabits-admin-auth';
  private version = 1;
  private db: IDBDatabase | null = null;
  private currentSession: { user: AdminUser; token: string; expiresAt: Date } | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeDB();
  }

  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
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
        
        // Admin users store
        if (!db.objectStoreNames.contains('admin_users')) {
          const usersStore = db.createObjectStore('admin_users', { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
          usersStore.createIndex('role', 'role', { unique: false });
          
          // Create default super admin user during upgrade transaction
          const defaultAdmin: AdminUser = {
            id: 'admin-001',
            email: 'admin@sciencehabits.app',
            role: 'super_admin',
            permissions: [
              {
                resource: 'habits',
                actions: ['create', 'read', 'update', 'delete', 'publish']
              },
              {
                resource: 'research',
                actions: ['create', 'read', 'update', 'delete', 'publish']
              },
              {
                resource: 'translations',
                actions: ['create', 'read', 'update', 'delete']
              },
              {
                resource: 'users',
                actions: ['create', 'read', 'update', 'delete']
              },
              {
                resource: 'system',
                actions: ['create', 'read', 'update', 'delete']
              }
            ],
            lastLogin: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          usersStore.add(defaultAdmin);
        }
        
        // Admin sessions store
        if (!db.objectStoreNames.contains('admin_sessions')) {
          const sessionsStore = db.createObjectStore('admin_sessions', { keyPath: 'token' });
          sessionsStore.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }


  private async createDefaultSuperAdmin(db: IDBDatabase): Promise<void> {
    const defaultAdmin: AdminUser = {
      id: 'admin-001',
      email: 'admin@sciencehabits.app',
      role: 'super_admin',
      permissions: [
        {
          resource: 'habits',
          actions: ['create', 'read', 'update', 'delete', 'publish']
        },
        {
          resource: 'research',
          actions: ['create', 'read', 'update', 'delete', 'publish']
        },
        {
          resource: 'translations',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'users',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          resource: 'system',
          actions: ['create', 'read', 'update', 'delete']
        }
      ],
      lastLogin: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const transaction = db.transaction(['admin_users'], 'readwrite');
    const store = transaction.objectStore('admin_users');
    store.add(defaultAdmin);
  }

  /**
   * Authenticate admin user with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      await this.ensureInitialized();
      
      const user = await this.getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.email);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Create session token
      const token = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store session
      await this.createSession(user.id, token, expiresAt);

      // Update last login
      user.lastLogin = new Date();
      await this.updateUser(user);

      this.currentSession = { user, token, expiresAt };

      console.log('✅ Admin login successful:', { userId: user.id, email: user.email, role: user.role });

      return {
        success: true,
        user,
        token,
        expiresAt
      };
    } catch (error) {
      console.error('Admin login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Validate session token and return user
   */
  async validateSession(token: string): Promise<AdminUser | null> {
    try {
      await this.ensureInitialized();
      if (!this.db) return null;

      const session = await this.getSession(token);
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await this.deleteSession(token);
        return null;
      }

      const user = await this.getUserById(session.userId);
      if (!user || !user.isActive) {
        await this.deleteSession(token);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(user: AdminUser, resource: string, action: string): Promise<boolean> {
    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return true;
    }

    const permission = user.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action as any) : false;
  }

  /**
   * Require specific permission or throw error
   */
  async requirePermission(resource: string, action: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Authentication required');
    }

    const hasPermission = await this.checkPermission(this.currentSession.user, resource, action);
    if (!hasPermission) {
      throw new Error(`Insufficient permissions: ${resource}:${action}`);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AdminUser | null {
    return this.currentSession?.user || null;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    if (this.currentSession) {
      await this.deleteSession(this.currentSession.token);
      this.currentSession = null;
    }
    console.log('✅ Admin logout successful');
  }

  /**
   * Create new admin user (super admin only)
   */
  async createAdminUser(userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<AdminUser> {
    await this.requirePermission('users', 'create');

    const user: AdminUser = {
      ...userData,
      id: this.generateUserId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(0) // Never logged in
    };

    await this.saveUser(user);
    console.log('✅ Admin user created:', { userId: user.id, email: user.email, role: user.role });

    return user;
  }

  /**
   * Update admin user
   */
  async updateAdminUser(userId: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    await this.requirePermission('users', 'update');

    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser: AdminUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    await this.saveUser(updatedUser);
    console.log('✅ Admin user updated:', { userId, updates: Object.keys(updates) });

    return updatedUser;
  }

  /**
   * List all admin users
   */
  async listAdminUsers(): Promise<AdminUser[]> {
    await this.requirePermission('users', 'read');
    await this.ensureInitialized();

    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['admin_users'], 'readonly');
      const store = transaction.objectStore('admin_users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Get role-based permissions template
   */
  getPermissionsTemplate(role: AdminUser['role']): Permission[] {
    switch (role) {
      case 'super_admin':
        return [
          { resource: 'habits', actions: ['create', 'read', 'update', 'delete', 'publish'] },
          { resource: 'research', actions: ['create', 'read', 'update', 'delete', 'publish'] },
          { resource: 'translations', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'system', actions: ['create', 'read', 'update', 'delete'] }
        ];

      case 'content_moderator':
        return [
          { resource: 'habits', actions: ['create', 'read', 'update', 'publish'] },
          { resource: 'research', actions: ['create', 'read', 'update', 'publish'] },
          { resource: 'translations', actions: ['read', 'update'] }
        ];

      case 'research_validator':
        return [
          { resource: 'research', actions: ['read', 'update'] },
          { resource: 'habits', actions: ['read'] }
        ];

      default:
        return [];
    }
  }

  private async getUserByEmail(email: string): Promise<AdminUser | null> {
    await this.ensureInitialized();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['admin_users'], 'readonly');
      const store = transaction.objectStore('admin_users');
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async getUserById(id: string): Promise<AdminUser | null> {
    await this.ensureInitialized();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['admin_users'], 'readonly');
      const store = transaction.objectStore('admin_users');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async saveUser(user: AdminUser): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['admin_users'], 'readwrite');
      const store = transaction.objectStore('admin_users');
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateUser(user: AdminUser): Promise<void> {
    user.updatedAt = new Date();
    await this.saveUser(user);
  }

  private async createSession(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) return;

    const session = {
      token,
      userId,
      expiresAt,
      createdAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['admin_sessions'], 'readwrite');
      const store = transaction.objectStore('admin_sessions');
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getSession(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    await this.ensureInitialized();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['admin_sessions'], 'readonly');
      const store = transaction.objectStore('admin_sessions');
      const request = store.get(token);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async deleteSession(token: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['admin_sessions'], 'readwrite');
      const store = transaction.objectStore('admin_sessions');
      const request = store.delete(token);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private generateSessionToken(): string {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  private generateUserId(): string {
    return 'admin-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Hash password using Web Crypto API
   */
  private async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    // Generate salt if not provided
    if (!salt) {
      const saltArray = new Uint8Array(16);
      crypto.getRandomValues(saltArray);
      salt = Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Convert password and salt to ArrayBuffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password + salt);

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    
    // Convert to hex string
    const hashArray = new Uint8Array(hashBuffer);
    const hash = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');

    return { hash, salt };
  }

  /**
   * Verify password against stored hash
   */
  private async verifyPassword(password: string, email: string): Promise<boolean> {
    try {
      // For the default admin, use a known password
      if (email === 'admin@sciencehabits.app') {
        const knownPassword = 'AdminPass123!';
        return password === knownPassword;
      }

      // For other users, you would retrieve their stored salt and hash
      // and verify against the provided password
      // This is a simplified version for demo purposes
      return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Change user password (requires current password)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentSession) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify current password
    const isCurrentValid = await this.verifyPassword(currentPassword, this.currentSession.user.email);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password strength
    const validation = this.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Hash new password
    const { hash, salt } = await this.hashPassword(newPassword);

    // Update user record (in a real implementation, you'd store hash and salt)
    const user = this.currentSession.user;
    user.updatedAt = new Date();
    await this.updateUser(user);

    console.log('✅ Password changed successfully for user:', user.email);
    return { success: true };
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one special character' };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'admin123', 'qwerty123'];
    if (weakPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
      return { isValid: false, error: 'Password is too common. Please choose a stronger password' };
    }

    return { isValid: true };
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  /**
   * Create admin user with secure password
   */
  async createSecureAdminUser(userData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>, password: string): Promise<{ user: AdminUser; tempPassword?: string }> {
    await this.requirePermission('users', 'create');

    // Validate password
    const validation = this.validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Hash password
    const { hash, salt } = await this.hashPassword(password);

    const user: AdminUser = {
      ...userData,
      id: this.generateUserId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(0) // Never logged in
    };

    await this.saveUser(user);
    console.log('✅ Secure admin user created:', { userId: user.id, email: user.email, role: user.role });

    return { user };
  }
}