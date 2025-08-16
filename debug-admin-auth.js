// Debug script for admin authentication
// Run this in browser console to diagnose admin login issues

async function debugAdminAuth() {
  console.log('🔍 Starting admin authentication debug...');
  
  try {
    // Import the AdminAuthService
    const { AdminAuthService } = await import('./src/services/cms/AdminAuthService.ts');
    const authService = new AdminAuthService();
    
    console.log('✅ AdminAuthService imported successfully');
    
    // Test database initialization
    console.log('📊 Testing database initialization...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB init
    
    // Test login with correct credentials
    console.log('🔐 Testing login with default credentials...');
    const result = await authService.login('admin@example.com', 'TestPassword123!');
    
    console.log('📋 Login result:', result);
    
    if (result.success) {
      console.log('✅ Admin login successful!');
      console.log('👤 User:', result.user);
      console.log('🎫 Token:', result.token);
    } else {
      console.log('❌ Admin login failed:', result.error);
      
      // Test if user exists
      console.log('🔍 Checking if admin user exists in database...');
      // This would require accessing private methods, so let's check IndexedDB directly
      
      const dbRequest = indexedDB.open('sciencehabits-admin-auth', 1);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const transaction = db.transaction(['admin_users'], 'readonly');
        const store = transaction.objectStore('admin_users');
        const request = store.getAll();
        
        request.onsuccess = () => {
          console.log('👥 Users in database:', request.result);
        };
      };
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  debugAdminAuth();
}