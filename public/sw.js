// Service Worker for Tahdiibul Adfaal MIS Mobile Web App
const CACHE_NAME = 'tahdiib-mis-cache-v3.1.0';

// Essential App Shell resources to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon.svg',
  '/logo.jpg',
  '/tahdiib_logo.jpg',
  '/audio/alert_breakfast_so.mp3',
  '/audio/alert_lunch_so.mp3',
  '/audio/alert_evening_break_so.mp3',
  '/audio/alert_breakfast_so.wav',
  '/audio/alert_lunch_so.wav',
  '/audio/alert_evening_break_so.wav'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Pre-caching app shell assets for offline availability');
      await Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`Non-critical asset precache notice (${asset}):`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SCHEDULE_3_ALERTS') {
    self.scheduledAlertSlots = event.data.slots || [];
    self.alertsEnabled = event.data.enabled !== false;
    console.log('SW Registered Scheduled Alert Slots:', self.scheduledAlertSlots);
  }

  if (event.data.type === 'TRIGGER_BACKGROUND_ALERT') {
    const { title, body, slotId, vibration } = event.data;
    const options = {
      body: body || '🔔 Waqtigii digniinta 3-da waqti ayaa la gaaray!',
      icon: '/pwa-icon.svg',
      badge: '/pwa-icon.svg',
      tag: `tahdiib-alert-${slotId || 'general'}`,
      renotify: true,
      requireInteraction: true,
      vibrate: vibration || [600, 150, 600, 150, 800, 200, 1200],
      data: {
        url: '/',
        slotId: slotId || 'general',
        timestamp: new Date().toISOString()
      },
      actions: [
        { action: 'open_app', title: '👁️ Fur App-ka' },
        { action: 'mute', title: '🔕 Aamusii' }
      ]
    };

    self.registration.showNotification(title || 'Machadka Tahdiibul Adfaal', options);

    // Broadcast sound trigger & Somali Voice alert to all connected client tabs
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({
          type: 'PLAY_ALERT_SIREN',
          title,
          body,
          slotId
        });
        client.postMessage({
          type: 'PLAY_SOMALI_VOICE_ALERT',
          title,
          body,
          slotId
        });
      }
    });
  }
});

// Service Worker Alarm Scheduler Check Loop
setInterval(() => {
  if (!self.alertsEnabled || !self.scheduledAlertSlots || !self.scheduledAlertSlots.length) {
    return;
  }

  const now = new Date();
  const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  self.scheduledAlertSlots.forEach((slot) => {
    if (slot.enabled && slot.time === currentHHmm) {
      const lockKey = `sw_alert_fired_${slot.slotId}_${todayStr}_${currentHHmm}`;
      if (!self[lockKey]) {
        self[lockKey] = true;

        const title = slot.title || 'Machadka Tahdiibul Adfaal';
        const body = slot.message || `🔔 Waqtigii ${slot.label || 'digniinta'} ayaa la gaaray (${slot.time})!`;

        self.registration.showNotification(title, {
          body,
          icon: '/pwa-icon.svg',
          badge: '/pwa-icon.svg',
          tag: `tahdiib-alert-${slot.slotId}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [600, 150, 600, 150, 800, 200, 1200],
          data: { url: '/', slotId: slot.slotId, timestamp: new Date().toISOString() },
          actions: [
            { action: 'open_app', title: '👁️ Fur App-ka' },
            { action: 'mute', title: '🔕 Aamusii' }
          ]
        });

        // Broadcast sound trigger
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          for (const client of clients) {
            client.postMessage({
              type: 'PLAY_ALERT_SIREN',
              title,
              body,
              slotId: slot.slotId
            });
          }
        });
      }
    }
  });
}, 20000); // Check every 20s

// Notification Click Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'mute') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip chrome extension and dev server internal ws requests
  if (url.protocol.startsWith('chrome-extension') || url.pathname.includes('/@vite/') || url.pathname.includes('/@react-refresh')) {
    return;
  }

  // Cache-First Strategy with Background Cache Refresh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Background network fetch to keep cache updated
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed (offline)
          return null;
        });

      // If cached response exists, return it immediately (Cache-First)
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, wait for network
      return fetchPromise.then((networkResponse) => {
        if (networkResponse) {
          return networkResponse;
        }

        // Offline Fallback for SPA navigation/HTML requests
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          return caches.match('/index.html') || caches.match('/');
        }

        return new Response('Offline resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

