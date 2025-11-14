import { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '../utils/notification.utils';

export const useNotifications = (userId, token) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported && Notification.permission === 'granted') {
      setIsEnabled(true);
    }
  }, []);

  const enableNotifications = async () => {
    setIsLoading(true);
    try {
      const permissionGranted = await requestNotificationPermission();
      if (permissionGranted) {
        const subscribed = await subscribeToPushNotifications(userId, token);
        setIsEnabled(subscribed);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async () => {
    setIsLoading(true);
    try {
      const unsubscribed = await unsubscribeFromPushNotifications(token);
      if (unsubscribed) {
        setIsEnabled(false);
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isEnabled,
    isLoading,
    enableNotifications,
    disableNotifications
  };
};
