// TalkEasi Service Worker — Push Notifications only.
//
// NOTE: App-shell / asset caching was intentionally removed. The previous
// cache-first strategy caused stale JavaScript to be served in normal browsers
// (while incognito always loaded fresh code), which could leave users stuck on
// actions like Sign In. This worker now only handles push notifications and
// actively clears any old caches left by previous versions.

// Take control immediately on install.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// On activate, delete ALL caches created by previous versions of this worker
// so no stale app code/assets are ever served again.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        // Reload open tabs so they pick up fresh code immediately.
        const windowClients = await self.clients.matchAll({ type: 'window' });
        await Promise.all(
          windowClients.map((client) => {
            try {
              return client.navigate(client.url);
            } catch (e) {
              return Promise.resolve();
            }
          })
        );
      } catch (e) {
        // no-op
      }
    })()
  );
});

// IMPORTANT: No 'fetch' handler. Without it the browser goes straight to the
// network for every request, so users always get the latest code.

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'TalkEasi',
    body: 'Nova is thinking about you! 💬',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'talkeasi-notification',
    data: { url: '/home' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    // Ignore malformed payloads
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    renotify: true,
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Talk to Nova 💬' },
      { action: 'dismiss', title: 'Later' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
