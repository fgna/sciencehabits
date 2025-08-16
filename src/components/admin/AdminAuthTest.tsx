import React, { useState, useEffect } from 'react';
import { AdminAuthService } from '../../services/cms/AdminAuthService';

export function AdminAuthTest() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [authService] = useState(() => new AdminAuthService());

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    testAdminAuth();
  }, []);

  const testAdminAuth = async () => {
    try {
      addLog('🔍 Starting admin authentication test...');
      setStatus('Testing...');

      // Test 1: Check IndexedDB initialization
      addLog('📊 Testing IndexedDB access...');
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 2: Try to access the database directly
      addLog('🗄️ Checking admin database...');
      
      const dbRequest = indexedDB.open('sciencehabits-admin-auth', 1);
      
      await new Promise<void>((resolve, reject) => {
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          addLog(`✅ Database opened successfully. Version: ${db.version}`);
          addLog(`📋 Object stores: ${Array.from(db.objectStoreNames).join(', ')}`);
          
          if (db.objectStoreNames.contains('admin_users')) {
            const transaction = db.transaction(['admin_users'], 'readonly');
            const store = transaction.objectStore('admin_users');
            const request = store.getAll();
            
            request.onsuccess = () => {
              const users = request.result;
              addLog(`👥 Found ${users.length} admin users in database`);
              users.forEach((user: any) => {
                addLog(`   - ${user.email} (${user.role}) - Active: ${user.isActive}`);
              });
              resolve();
            };
            
            request.onerror = () => {
              addLog(`❌ Error reading users: ${request.error}`);
              resolve();
            };
          } else {
            addLog('❌ admin_users store not found');
            resolve();
          }
          
          db.close();
        };
        
        dbRequest.onerror = () => {
          addLog(`❌ Database error: ${dbRequest.error}`);
          reject(dbRequest.error);
        };
        
        dbRequest.onupgradeneeded = () => {
          addLog('🔧 Database upgrade needed - creating stores...');
        };
      });

      // Test 3: Try admin login
      addLog('🔐 Testing admin login...');
      const loginResult = await authService.login('admin@example.com', 'TestPassword123!');
      
      if (loginResult.success) {
        addLog('✅ Admin login successful!');
        addLog(`👤 User: ${loginResult.user?.email} (${loginResult.user?.role})`);
        setStatus('✅ Login Test Passed');
      } else {
        addLog(`❌ Admin login failed: ${loginResult.error}`);
        setStatus('❌ Login Test Failed');
      }

    } catch (error) {
      addLog(`💥 Test failed with error: ${error}`);
      setStatus('💥 Test Error');
    }
  };

  const retryTest = () => {
    setLogs([]);
    testAdminAuth();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Auth Diagnostic</h1>
              <p className="text-gray-600">Status: {status}</p>
            </div>
            <button
              onClick={retryTest}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry Test
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div>No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Test Credentials</h3>
            <div className="text-sm text-blue-800">
              <div><strong>Email:</strong> admin@example.com</div>
              <div><strong>Password:</strong> TestPassword123!</div>
              <div className="text-xs text-gray-600 mt-1">For testing purposes only</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}