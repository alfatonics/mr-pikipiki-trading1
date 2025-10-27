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

  // Initialize with sample notifications
  useEffect(() => {
    const initialNotifications = [
      { 
        id: 1, 
        message: 'New repair request assigned to you', 
        time: new Date(Date.now() - 2 * 60 * 1000), 
        type: 'info',
        read: false,
        priority: 'medium'
      },
      { 
        id: 2, 
        message: 'Monthly sales target reached! Great job!', 
        time: new Date(Date.now() - 60 * 60 * 1000), 
        type: 'success',
        read: false,
        priority: 'high'
      },
      { 
        id: 3, 
        message: 'Transport delivery completed successfully', 
        time: new Date(Date.now() - 3 * 60 * 60 * 1000), 
        type: 'info',
        read: true,
        priority: 'low'
      },
      { 
        id: 4, 
        message: 'New customer registration pending approval', 
        time: new Date(Date.now() - 5 * 60 * 60 * 1000), 
        type: 'warning',
        read: false,
        priority: 'high'
      },
      { 
        id: 5, 
        message: 'System maintenance scheduled for tonight', 
        time: new Date(Date.now() - 24 * 60 * 60 * 1000), 
        type: 'info',
        read: false,
        priority: 'medium'
      }
    ];
    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);
  }, []);

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
