// Service Worker for Push Notifications
// Handles background push messages and notification clicks

// Install event - cache resources if needed
self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  // Skip waiting to immediately activate the new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches if needed
self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  // Claim all clients to start controlling them immediately
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('Push message received:', event);

  if (!event.data) {
    console.log('Push message has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body || 'Vous avez une nouvelle notification',
      icon: '/omegalogo.png', // Your app icon
      badge: '/omegalogo.png', // Badge for notification
      image: data.image, // Optional large image
      data: {
        ticketId: data.ticketId,
        type: data.type,
        url: data.url || '/customer' // Default URL to open
      },
      actions: [
        {
          action: 'view',
          title: 'Voir',
          icon: '/omegalogo.png'
        },
        {
          action: 'dismiss',
          title: 'Ignorer'
        }
      ],
      requireInteraction: true, // Keep notification visible until user interacts
      silent: false, // Make sound/vibration
      tag: data.tag || 'repair-notification', // Group similar notifications
      renotify: true // Show notification even if one with same tag exists
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'O\'MEGA Services', options)
    );
  } catch (error) {
    console.error('Error processing push message:', error);

    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('O\'MEGA Services', {
        body: 'Vous avez une nouvelle notification',
        icon: '/omegalogo.png',
        tag: 'repair-notification'
      })
    );
  }
});

// Notification click event - handle when user clicks on notification
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);

  event.notification.close();

  // Send message to client about notification click
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const url = event.notification.data?.url || '/customer';

        // Check if there's already a window open with this URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(url) && 'focus' in client) {
            // Window already open, focus it
            return client.focus();
          }
        }

        // No window open, open new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
      .then(() => {
        // Send message to the client about the notification click
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              payload: {
                action: event.action,
                ticketId: event.notification.data?.ticketId,
                type: event.notification.data?.type
              }
            });
          });
        });
      })
  );
});

// Notification close event - handle when notification is dismissed
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);

  // Send message to client about notification close
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_CLOSE',
          payload: {
            ticketId: event.notification.data?.ticketId,
            type: event.notification.data?.type
          }
        });
      });
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', event => {
  console.log('Message received in service worker:', event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: '1.0.0' });
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// Background sync (optional - for offline functionality)
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // This could sync pending actions when the user comes back online
  console.log('Performing background sync...');
}

// Periodic background sync (optional)
self.addEventListener('periodicsync', event => {
  console.log('Periodic sync triggered:', event.tag);

  if (event.tag === 'periodic-sync') {
    event.waitUntil(doPeriodicSync());
  }
});

async function doPeriodicSync() {
  // Implement periodic sync logic here
  // This could check for updates or perform maintenance tasks
  console.log('Performing periodic sync...');
}
