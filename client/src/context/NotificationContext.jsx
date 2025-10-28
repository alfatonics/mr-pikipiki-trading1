import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored).map(n => ({
          ...n,
          time: n.time ? new Date(n.time) : new Date()
        }));
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const addNotification = (message, type = 'info', priority = 'medium') => {
    const newNotification = {
      id: Date.now(),
      message,
      time: new Date(),
      type,
      read: false,
      priority
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllRead = () => {
    setNotifications(prev => prev.filter(notification => !notification.read));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Expose addNotification function globally for testing
  useEffect(() => {
    window.addNotification = addNotification;
    return () => {
      delete window.addNotification;
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllRead,
    clearAllNotifications,
    setNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
