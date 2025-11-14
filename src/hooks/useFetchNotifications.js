import { useState, useEffect } from 'react';
import config from '../config/api.config';

export const useFetchNotifications = (token, userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async (limit = 20, offset = 0) => {
    if (!token) {
      console.warn('Cannot fetch notifications: token is missing');
      return;
    }

    setIsLoading(true);
    try {
      const url = `${config.API_BASE_URL}${config.api.notifications.list}?limit=${limit}&offset=${offset}`;
      console.log('Fetching notifications from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.error('Notifications fetch failed:', response.status, response.statusText);
        console.error('Response Content-Type:', contentType);
        
        if (contentType && contentType.includes('text/html')) {
          const html = await response.text();
          console.error('Received HTML instead of JSON:', html.substring(0, 500));
        }
        
        setNotifications([]);
        return;
      }

      const data = await response.json();
      console.log('Notifications fetched successfully:', data);
      setNotifications(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) {
      console.warn('Cannot fetch unread count: token is missing');
      return;
    }

    try {
      const url = `${config.API_BASE_URL}${config.api.notifications.unreadCount}`;
      console.log('Fetching unread count from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.error('Unread count fetch failed:', response.status, response.statusText);
        console.error('Response Content-Type:', contentType);
        
        if (contentType && contentType.includes('text/html')) {
          const html = await response.text();
          console.error('Received HTML instead of JSON:', html.substring(0, 500));
        }
        
        setUnreadCount(0);
        return;
      }

      const data = await response.json();
      console.log('Unread count fetched:', data);
      setUnreadCount(data.unread_count || 0);
      
      // Update badge
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const url = `${config.API_BASE_URL}${config.api.notifications.markRead(notificationId)}`;
      console.log('Marking as read:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Mark as read failed:', response.status);
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId
            ? { ...n, is_read: true, read_at: new Date() }
            : n
        )
      );

      // Update badge
      await fetchUnreadCount();
      console.log('Notification marked as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const url = `${config.API_BASE_URL}${config.api.notifications.markAllRead}`;
      console.log('Marking all as read:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Mark all as read failed:', response.status);
        throw new Error('Failed to mark all as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date() }))
      );

      setUnreadCount(0);
      
      if ('setAppBadge' in navigator) {
        navigator.clearAppBadge();
      }
      console.log('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const url = `${config.API_BASE_URL}${config.api.notifications.delete(notificationId)}`;
      console.log('Deleting notification:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Delete failed:', response.status);
        throw new Error('Failed to delete notification');
      }

      setNotifications(prev =>
        prev.filter(n => n.notification_id !== notificationId)
      );

      await fetchUnreadCount();
      console.log('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) {
      console.log('No notifications to clear');
      return;
    }

    try {
      console.log('Clearing all notifications...');
      
      // Delete all notifications in parallel
      const deletePromises = notifications.map(notification =>
        fetch(`${config.API_BASE_URL}${config.api.notifications.delete(notification.notification_id)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(err => {
          console.error(`Failed to delete notification ${notification.notification_id}:`, err);
          return null;
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r && r.ok).length;
      
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
      
      // Clear badge
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge();
      }
      
      console.log(`✅ Cleared ${successCount} notifications`);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  useEffect(() => {
    if (!token) {
      console.warn('useFetchNotifications: token is missing');
      return;
    }

    if (!userId) {
      console.warn('useFetchNotifications: userId is missing');
      return;
    }

    console.log('useFetchNotifications: initializing with token and userId');
    
    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [token, userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  };
};
