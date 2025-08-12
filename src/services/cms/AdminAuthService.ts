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
        
        // Admin users store
        if (!db.objectStoreNames.contains('admin_users')) {
          const usersStore = db.createObjectStore('admin_users', { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
          usersStore.createIndex('role', 'role', { unique: false });
        }
        
        // Admin sessions store
        if (!db.objectStoreNames.contains('admin_sessions')) {
          const sessionsStore = db.createObjectStore('admin_sessions', { keyPath: 'token' });
          sessionsStore.createIndex('userId', 'userId', { unique: false });
        }

        // Create default super admin user
        this.createDefaultSuperAdmin(db);
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
      // In production, this would validate against a secure backend
      // For development, we'll use a simplified approach
      
      const user = await this.getUserByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // In production, verify password hash
      // For development, accept any password for demo purposes
      if (password.length < 6) {
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
}