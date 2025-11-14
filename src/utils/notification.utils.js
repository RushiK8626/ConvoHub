// Request user permission for notifications
import config from '../config/api.config';

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('⚠️ This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
    }
  }

  return false;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (userId, token) => {
  try {
    // Check if already supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('⚠️ Push notifications not supported');
      return false;
    }

    console.log('📱 Starting push subscription process...');

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');
    console.log('Service Worker scope:', registration.scope);
    console.log('Service Worker state:', registration.active ? 'active' : 'not active');

    // Check existing subscription
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      console.log('✅ Already subscribed:', existingSub.endpoint);
      return true;
    }
    
    console.log('No existing subscription found, proceeding with new subscription...');

    // Fetch VAPID public key from backend
    console.log('🔑 Fetching VAPID public key...');
    const vapidUrl = `${config.API_BASE_URL}${config.api.notifications.vapidPublicKey}`;
    console.log('VAPID URL:', vapidUrl);
    
    const vapidResponse = await fetch(vapidUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!vapidResponse.ok) {
      console.error('❌ Failed to fetch VAPID key:', vapidResponse.status, vapidResponse.statusText);
      const errorText = await vapidResponse.text();
      console.error('Response body:', errorText.substring(0, 500));
      return false;
    }

    const contentType = vapidResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ VAPID endpoint returned non-JSON response:', contentType);
      const responseText = await vapidResponse.text();
      console.error('Response:', responseText.substring(0, 500));
      return false;
    }

    const vapidData = await vapidResponse.json();
    console.log('✅ VAPID key received');
    
    if (!vapidData.vapidPublicKey) {
      console.error('❌ VAPID key missing in response:', vapidData);
      return false;
    }
    
    const { vapidPublicKey } = vapidData;

    // Validate VAPID key
    console.log('🔍 Validating VAPID key...');
    if (!vapidPublicKey) {
      console.error('❌ VAPID public key is empty');
      return false;
    }
    
    console.log('VAPID key preview:', vapidPublicKey.substring(0, 20) + '...');
    console.log('VAPID key length:', vapidPublicKey.length);

    // Try to convert VAPID key
    let vapidUint8Array;
    try {
      vapidUint8Array = urlBase64ToUint8Array(vapidPublicKey);
      console.log('✅ VAPID key converted to Uint8Array, length:', vapidUint8Array.length);
    } catch (keyError) {
      console.error('❌ Failed to convert VAPID key:', keyError.message);
      console.error('VAPID key value:', vapidPublicKey);
      return false;
    }

    // Subscribe to push
    console.log('🔔 Subscribing to push notifications...');
    
    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidUint8Array
      });
      console.log('✅ Push subscription created:', subscription.endpoint);
    } catch (subscribeError) {
      console.error('❌ Push subscription failed with error:', subscribeError.name, subscribeError.message);
      
      // Check notification permission
      const permission = Notification.permission;
      console.log('Notification permission status:', permission);
      
      if (permission === 'denied') {
        console.error('❌ Notification permission is DENIED. User blocked notifications in browser settings.');
        return false;
      }
      
      if (permission === 'default') {
        console.error('❌ Notification permission not yet requested. Need to request permission first.');
        return false;
      }
      
      console.error('Full error details:', {
        name: subscribeError.name,
        message: subscribeError.message,
        code: subscribeError.code,
        stack: subscribeError.stack
      });
      
      throw subscribeError;
    }

    // Send subscription to backend
    console.log('📤 Sending subscription to backend...');
    const subscriptionJson = subscription.toJSON();
    console.log('Subscription data being sent:', {
      endpoint: subscriptionJson.endpoint.substring(0, 50) + '...',
      keysLength: subscriptionJson.keys ? Object.keys(subscriptionJson.keys).length : 0
    });

    const subscribeUrl = `${config.API_BASE_URL}${config.api.notifications.subscribe}`;
    console.log('Subscribe URL:', subscribeUrl);
    
    const response = await fetch(subscribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: subscriptionJson
      })
    });

    if (!response.ok) {
      const responseData = await response.json();
      console.error('❌ Failed to save subscription:', response.status, responseData);
      return false;
    }

    const responseData = await response.json();
    console.log('✅ Subscription saved on backend:', responseData);
    return true;
  } catch (error) {
    console.error('❌ Error subscribing to push:', error.message, error);
    return false;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (token) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Push subscription removed locally');

      // Notify backend
      const unsubscribeUrl = `${config.API_BASE_URL}${config.api.notifications.unsubscribe}`;
      
      const response = await fetch(unsubscribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('✅ Backend notified of unsubscribe');
      } else {
        console.warn('⚠️ Backend unsubscribe notification failed:', response.status);
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Error unsubscribing:', error);
  }
  return false;
};

// Convert VAPID key from base64 to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};