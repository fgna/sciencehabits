import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Service Worker and Offline Support
import { initializeServiceWorker } from './services/swRegistration';
import { initializeServiceWorkerSync } from './services/serviceWorkerSync';
import { initializeOfflineQueue } from './services/offlineQueue';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize service worker and offline capabilities
async function initializeOfflineSupport() {
  try {
    console.log('[App] Initializing offline support...');
    
    // Initialize offline queue first
    await initializeOfflineQueue();
    console.log('[App] Offline queue initialized');
    
    // Initialize service worker
    const swRegistered = await initializeServiceWorker();
    if (swRegistered) {
      console.log('[App] Service worker registered successfully');
      
      // Initialize service worker sync integration
      await initializeServiceWorkerSync();
      console.log('[App] Service worker sync integration initialized');
    } else {
      console.warn('[App] Service worker not registered (likely development mode or unsupported)');
    }
    
    // Setup global offline event handlers
    setupOfflineEventHandlers();
    
    console.log('[App] Offline support initialization complete');
  } catch (error) {
    console.error('[App] Failed to initialize offline support:', error);
    // App should still work without offline support
  }
}

// Setup global event handlers for offline notifications
function setupOfflineEventHandlers() {
  // Listen for service worker update notifications
  window.addEventListener('sw-update-available', (event) => {
    console.log('[App] Service worker update available');
    
    // Could show a notification to the user here
    const updateNotification = document.createElement('div');
    updateNotification.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; background: #2563eb; color: white; padding: 12px; text-align: center; z-index: 9999;">
        🔄 App update available. <button onclick="window.location.reload()" style="color: white; text-decoration: underline; background: none; border: none; cursor: pointer; margin-left: 8px;">Refresh to update</button>
      </div>
    `;
    document.body.appendChild(updateNotification);
  });

  // Listen for sync errors
  window.addEventListener('sw-sync-error', (event) => {
    const customEvent = event;
    console.warn('[App] Sync error:', customEvent.detail);
    
    // Could show a notification about sync issues
    if (customEvent.detail && customEvent.detail.failedOperations > 0) {
      console.warn(`[App] ${customEvent.detail.failedOperations} operations failed to sync`);
    }
  });

  // Listen for online/offline changes
  window.addEventListener('online', () => {
    console.log('[App] Back online');
    
    // Remove offline indicator if present
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.remove();
    }
  });

  window.addEventListener('offline', () => {
    console.log('[App] Gone offline');
    
    // Show offline indicator
    const offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; padding: 8px; text-align: center; z-index: 9999; font-size: 14px;">
        📡 You're offline. Changes will be saved and synced when connection returns.
      </div>
    `;
    document.body.appendChild(offlineIndicator);
  });
}

// Initialize offline support after the app renders
initializeOfflineSupport();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
