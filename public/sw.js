/**
 * ScienceHabits Service Worker
 * 
 * Comprehensive service worker for offline functionality, caching strategies,
 * and background sync capabilities for habit tracking data integrity.
 */

// Cache names and versions
const CACHE_NAMES = {
  APP_SHELL: 'sciencehabits-shell-v1',
  DATA: 'sciencehabits-data-v1',
  RESEARCH: 'sciencehabits-research-v1',
  IMAGES: 'sciencehabits-images-v1',
  TRANSLATIONS: 'sciencehabits-i18n-v1'
};

// Critical resources for offline functionality
const APP_SHELL_RESOURCES = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API patterns for different caching strategies
const CACHE_STRATEGIES = {
  APP_SHELL: /\/(static\/js\/|static\/css\/|favicon\.ico|logo\d+\.png).*$/,
  API_DATA: /\/api\/(habits|progress|analytics)/,
  RESEARCH: /\/api\/research/,
  TRANSLATIONS: /\/api\/translations/,
  IMAGES: /\.(jpg|jpeg|png|gif|webp|svg)$/
};

// Offline queue for critical operations
const OFFLINE_QUEUE_NAME = 'sciencehabits-offline-queue';
const BACKGROUND_SYNC_TAG = 'habit-sync';

// Maximum cache sizes (in MB)
const CACHE_LIMITS = {
  TOTAL: 50,
  RESEARCH: 20,
  DATA: 15,
  IMAGES: 10,
  TRANSLATIONS: 5
};

/**
 * Service Worker Install Event
 * Cache critical app shell resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAMES.APP_SHELL);
        await cache.addAll(APP_SHELL_RESOURCES);
        console.log('[SW] App shell cached successfully');
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Install failed:', error);
      }
    })()
  );
});

/**
 * Service Worker Activate Event
 * Clean up old caches and claim clients
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old cache versions
        const cacheNames = await caches.keys();
        const validCacheNames = Object.values(CACHE_NAMES);
        
        await Promise.all(
          cacheNames.map(cacheName => {
            if (!validCacheNames.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        
        // Claim all clients
        await self.clients.claim();
        console.log('[SW] Service worker activated and claimed clients');
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

/**
 * Service Worker Fetch Event
 * Implement caching strategies based on request type
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleFetchRequest(request));
});

/**
 * Handle fetch requests with appropriate caching strategies
 */
async function handleFetchRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // App Shell - Cache First
    if (CACHE_STRATEGIES.APP_SHELL.test(pathname) || pathname === '/') {
      return await cacheFirst(request, CACHE_NAMES.APP_SHELL);
    }
    
    // API Data - Network First with Cache Fallback
    if (CACHE_STRATEGIES.API_DATA.test(pathname)) {
      return await networkFirstWithCache(request, CACHE_NAMES.DATA);
    }
    
    // Research Content - Stale While Revalidate
    if (CACHE_STRATEGIES.RESEARCH.test(pathname)) {
      return await staleWhileRevalidate(request, CACHE_NAMES.RESEARCH);
    }
    
    // Translations - Cache First
    if (CACHE_STRATEGIES.TRANSLATIONS.test(pathname)) {
      return await cacheFirst(request, CACHE_NAMES.TRANSLATIONS);
    }
    
    // Images - Cache First
    if (CACHE_STRATEGIES.IMAGES.test(pathname)) {
      return await cacheFirst(request, CACHE_NAMES.IMAGES);
    }
    
    // Default - Network with Cache Fallback
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('[SW] Fetch handler error:', error);
    return await handleFetchError(request);
  }
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first network error:', error);
    throw error;
  }
}

/**
 * Network First with Cache Fallback Strategy
 */
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always attempt to fetch and update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('[SW] Background fetch failed:', error.message);
  });
  
  // Return cached version immediately if available
  return cachedResponse || await fetchPromise;
}

/**
 * Network with Cache Fallback (Default Strategy)
 */
async function networkWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Try to find in any cache as last resort
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    throw error;
  }
}

/**
 * Handle fetch errors with appropriate fallbacks
 */
async function handleFetchError(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return cached index.html
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAMES.APP_SHELL);
    const cachedIndex = await cache.match('/');
    if (cachedIndex) {
      return cachedIndex;
    }
  }
  
  // Return offline page or error response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

/**
 * Background Sync Event
 * Process offline queue when connectivity returns
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(processOfflineQueue());
  }
});

/**
 * Process offline operations queue
 */
async function processOfflineQueue() {
  try {
    console.log('[SW] Processing offline queue...');
    
    // Open IndexedDB to access offline queue
    const queueData = await getOfflineQueueData();
    
    if (queueData.length === 0) {
      console.log('[SW] No queued operations to process');
      return;
    }
    
    const processedItems = [];
    const failedItems = [];
    
    for (const item of queueData) {
      try {
        await processQueueItem(item);
        processedItems.push(item.id);
      } catch (error) {
        console.error('[SW] Failed to process queue item:', item.id, error);
        
        // Increment retry count
        item.retryCount = (item.retryCount || 0) + 1;
        
        // Remove items that have failed too many times
        if (item.retryCount >= 3) {
          processedItems.push(item.id);
        } else {
          failedItems.push(item);
        }
      }
    }
    
    // Clean up processed items and update failed items
    await updateOfflineQueue(processedItems, failedItems);
    
    console.log(`[SW] Processed ${processedItems.length} items, ${failedItems.length} failed`);
    
    // Notify the main thread about sync completion
    await notifyClients({
      type: 'SYNC_COMPLETE',
      processed: processedItems.length,
      failed: failedItems.length
    });
    
  } catch (error) {
    console.error('[SW] Offline queue processing failed:', error);
  }
}

/**
 * Process individual queue item
 */
async function processQueueItem(item) {
  switch (item.type) {
    case 'HABIT_COMPLETION':
      return await syncHabitCompletion(item.data);
    
    case 'CUSTOM_HABIT':
      return await syncCustomHabit(item.data);
    
    case 'PROGRESS_UPDATE':
      return await syncProgressUpdate(item.data);
    
    default:
      throw new Error(`Unknown queue item type: ${item.type}`);
  }
}

/**
 * Sync habit completion to server
 */
async function syncHabitCompletion(data) {
  const response = await fetch('/api/progress/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Sync custom habit to server
 */
async function syncCustomHabit(data) {
  const response = await fetch('/api/habits/custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Sync progress update to server
 */
async function syncProgressUpdate(data) {
  const response = await fetch('/api/progress/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * IndexedDB operations for offline queue
 */
async function getOfflineQueueData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ScienceHabitsDB', 3);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update offline queue after processing
 */
async function updateOfflineQueue(processedIds, failedItems) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ScienceHabitsDB', 3);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      
      // Remove processed items
      processedIds.forEach(id => store.delete(id));
      
      // Update failed items with new retry count
      failedItems.forEach(item => store.put(item));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Notify clients about service worker events
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'QUEUE_OFFLINE_OPERATION':
      queueOfflineOperation(data);
      break;
      
    case 'TRIGGER_SYNC':
      self.registration.sync.register(BACKGROUND_SYNC_TAG);
      break;
      
    case 'CLEAR_CACHE':
      clearSpecificCache(data.cacheName);
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Queue offline operation to IndexedDB
 */
async function queueOfflineOperation(operationData) {
  try {
    const queueItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      ...operationData
    };
    
    // Store in IndexedDB offline queue
    const stored = await storeOfflineOperation(queueItem);
    
    if (stored) {
      console.log('[SW] Queued offline operation:', queueItem.type);
      
      // Register for background sync
      await self.registration.sync.register(BACKGROUND_SYNC_TAG);
    }
  } catch (error) {
    console.error('[SW] Failed to queue offline operation:', error);
  }
}

/**
 * Store offline operation in IndexedDB
 */
async function storeOfflineOperation(queueItem) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ScienceHabitsDB', 3);
    
    request.onsuccess = () => {
      const db = request.result;
      
      // Check if offlineQueue store exists, create if not
      if (!db.objectStoreNames.contains('offlineQueue')) {
        console.warn('[SW] offlineQueue store not found, operation will be lost');
        resolve(false);
        return;
      }
      
      const transaction = db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      const addRequest = store.add(queueItem);
      
      addRequest.onsuccess = () => resolve(true);
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear specific cache
 */
async function clearSpecificCache(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log('[SW] Cleared cache:', cacheName);
  } catch (error) {
    console.error('[SW] Failed to clear cache:', cacheName, error);
  }
}

/**
 * Cache size management
 */
async function manageCacheSize() {
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      await limitCacheSize(cacheName, CACHE_LIMITS.TOTAL);
    }
  } catch (error) {
    console.error('[SW] Cache size management failed:', error);
  }
}

/**
 * Limit cache size using LRU eviction
 */
async function limitCacheSize(cacheName, maxSizeMB) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  if (requests.length === 0) return;
  
  // Estimate cache size (rough calculation)
  const estimatedSize = requests.length * 0.1; // MB per request (rough estimate)
  
  if (estimatedSize > maxSizeMB) {
    const excessRequests = Math.floor((estimatedSize - maxSizeMB) / 0.1);
    
    // Remove oldest entries (LRU eviction)
    for (let i = 0; i < excessRequests && i < requests.length; i++) {
      await cache.delete(requests[i]);
    }
    
    console.log(`[SW] Evicted ${excessRequests} entries from ${cacheName}`);
  }
}

// Periodic cache management
setInterval(manageCacheSize, 30 * 60 * 1000); // Every 30 minutes

console.log('[SW] Service worker script loaded');