import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const functions = getFunctions();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Subscribe to notifications
    const notificationsQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationIds) => {
    try {
      const markNotificationsRead = httpsCallable(functions, 'markNotificationsRead');
      await markNotificationsRead({ notificationIds });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);

    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return '❤️';
      case 'COMMENT':
        return '💬';
      case 'SHARE':
        return '🔄';
      case 'FRIEND_REQUEST':
        return '👥';
      case 'MESSAGE':
        return '✉️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'LIKE':
        return '#ff4081';
      case 'COMMENT':
        return '#2196f3';
      case 'SHARE':
        return '#4caf50';
      case 'FRIEND_REQUEST':
        return '#9c27b0';
      case 'MESSAGE':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
