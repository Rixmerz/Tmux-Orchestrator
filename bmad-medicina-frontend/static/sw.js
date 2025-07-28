/**
 * BMad - Service Worker
 * Provides offline functionality and push notifications
 * Optimized for medication adherence system
 */

const CACHE_NAME = 'bmad-medications-v1';
const STATIC_CACHE_NAME = 'bmad-static-v1';
const DYNAMIC_CACHE_NAME = 'bmad-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/calendario',
  '/static/styles.css',
  '/static/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other essential static assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/medications/,
  /\/api\/schedule/,
  /\/api\/alerts/,
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Static files - cache first
    if (STATIC_FILES.includes(url.pathname)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    }
    // API requests - network first with cache fallback
    else if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE_NAME));
    }
    // Other requests - network first
    else {
      event.respondWith(networkFirst(request));
    }
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: '💊 BMad Medicamentos',
    body: 'Es hora de tomar tu medicamento',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'medication-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'taken',
        title: '✅ Tomado',
        icon: '/icons/check-icon.png'
      },
      {
        action: 'snooze',
        title: '⏰ Recordar en 5 min',
        icon: '/icons/snooze-icon.png'
      },
      {
        action: 'view',
        title: '👁️ Ver Detalles',
        icon: '/icons/view-icon.png'
      }
    ],
    data: {
      url: '/calendario',
      medicationId: null,
      timestamp: Date.now()
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle different actions
  if (action === 'taken') {
    // Mark medication as taken
    event.waitUntil(
      handleMedicationTaken(data.medicationId)
    );
  } else if (action === 'snooze') {
    // Schedule a reminder in 5 minutes
    event.waitUntil(
      scheduleSnoozeReminder(data.medicationId, 5)
    );
  } else {
    // Default action or 'view' - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          return clients.openWindow(data.url || '/calendario');
        }
      })
    );
  }
});

// Background sync for offline medication tracking
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'medication-sync') {
    event.waitUntil(syncMedicationData());
  }
});

// Periodic background sync for medication reminders
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'medication-check') {
    event.waitUntil(checkMedicationReminders());
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SCHEDULE_MEDICATION_REMINDER':
      scheduleLocalReminder(payload);
      break;
    case 'UPDATE_MEDICATION_STATUS':
      updateMedicationStatus(payload);
      break;
    case 'REQUEST_SYNC':
      event.waitUntil(syncMedicationData());
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - No cached data available', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    return new Response('Network Error', { status: 503 });
  }
}

// Medication-specific functions
async function handleMedicationTaken(medicationId) {
  if (!medicationId) return;
  
  try {
    // Try to update via network
    const response = await fetch(`/api/medications/${medicationId}/taken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'notification'
      })
    });
    
    if (!response.ok) {
      throw new Error('Network request failed');
    }
    
    console.log('[SW] Medication marked as taken via network');
  } catch (error) {
    console.log('[SW] Network failed, storing for sync');
    
    // Store for background sync
    const db = await openIndexedDB();
    await db.add('pending-updates', {
      medicationId,
      action: 'taken',
      timestamp: new Date().toISOString(),
      source: 'notification'
    });
    
    // Request background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('medication-sync');
    }
  }
  
  // Show confirmation
  await self.registration.showNotification('✅ Medicamento Registrado', {
    body: 'Tu medicamento ha sido marcado como tomado',
    icon: '/icons/icon-192x192.png',
    tag: 'medication-taken',
    data: { url: '/calendario' }
  });
}

async function scheduleSnoozeReminder(medicationId, minutes) {
  if (!medicationId) return;
  
  const snoozeTime = Date.now() + (minutes * 60 * 1000);
  
  // Store snooze data
  const db = await openIndexedDB();
  await db.add('scheduled-reminders', {
    medicationId,
    scheduledTime: snoozeTime,
    type: 'snooze'
  });
  
  console.log(`[SW] Scheduled snooze reminder for ${minutes} minutes`);
  
  // Show confirmation
  await self.registration.showNotification('⏰ Recordatorio Programado', {
    body: `Te recordaremos en ${minutes} minutos`,
    icon: '/icons/icon-192x192.png',
    tag: 'snooze-scheduled'
  });
}

async function syncMedicationData() {
  console.log('[SW] Syncing medication data...');
  
  try {
    const db = await openIndexedDB();
    const pendingUpdates = await db.getAll('pending-updates');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/medications/${update.medicationId}/${update.action}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          await db.delete('pending-updates', update.id);
          console.log('[SW] Synced update:', update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync update:', update.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function checkMedicationReminders() {
  console.log('[SW] Checking medication reminders...');
  
  try {
    const db = await openIndexedDB();
    const now = Date.now();
    const reminders = await db.getAll('scheduled-reminders');
    
    for (const reminder of reminders) {
      if (reminder.scheduledTime <= now) {
        // Show reminder notification
        await self.registration.showNotification('💊 Recordatorio de Medicamento', {
          body: 'Es hora de tomar tu medicamento',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `medication-${reminder.medicationId}`,
          requireInteraction: true
        });
        
        // Remove processed reminder
        await db.delete('scheduled-reminders', reminder.id);
      }
    }
  } catch (error) {
    console.error('[SW] Failed to check reminders:', error);
  }
}

// IndexedDB helpers
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BMadMedicationsDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('pending-updates')) {
        const store = db.createObjectStore('pending-updates', { keyPath: 'id', autoIncrement: true });
        store.createIndex('medicationId', 'medicationId', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('scheduled-reminders')) {
        const store = db.createObjectStore('scheduled-reminders', { keyPath: 'id', autoIncrement: true });
        store.createIndex('scheduledTime', 'scheduledTime', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('medication-cache')) {
        const store = db.createObjectStore('medication-cache', { keyPath: 'id' });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
}

console.log('[SW] Service worker loaded successfully');