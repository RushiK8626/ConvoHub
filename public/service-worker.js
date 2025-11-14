// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'ConvoHub';
  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/badge-72x72.svg',
    tag: data.tag || 'notification',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    silent: data.silent || false,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/open.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const data = event.notification.data;
  const url = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if window already open
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === url && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync (optional - for queuing offline notifications)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/unread-count');
    const data = await response.json();
    // Update badge
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(data.unread_count);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
