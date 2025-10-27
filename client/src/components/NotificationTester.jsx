import React from 'react';
import { FiBell, FiCheckCircle, FiAlertCircle, FiX, FiInfo } from 'react-icons/fi';

const NotificationTester = () => {
  const testNotifications = [
    {
      type: 'info',
      message: 'New repair request assigned',
      icon: FiInfo,
      color: 'blue'
    },
    {
      type: 'success',
      message: 'Monthly sales target reached!',
      icon: FiCheckCircle,
      color: 'green'
    },
    {
      type: 'warning',
      message: 'Customer registration pending approval',
      icon: FiAlertCircle,
      color: 'yellow'
    },
    {
      type: 'error',
      message: 'Transport delivery failed',
      icon: FiX,
      color: 'red'
    }
  ];

  const addTestNotification = (type, message) => {
    if (window.addNotification) {
      window.addNotification(message, type, 'high');
    } else {
      alert('Notification system not available. Make sure TopBar is loaded.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <FiBell className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">🔔 Notification Tester</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Click the buttons below to test different types of notifications. 
        Check the bell icon in the top bar to see the notifications.
      </p>
      <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
        <p className="text-xs text-green-700">
          <strong>Status:</strong> {window.addNotification ? '✅ Notification system ready' : '❌ Notification system not loaded'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {testNotifications.map((notification, index) => (
          <button
            key={index}
            onClick={() => addTestNotification(notification.type, notification.message)}
            className={`flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left`}
          >
            <notification.icon className={`w-4 h-4 text-${notification.color}-500`} />
            <span className="text-sm font-medium text-gray-700">{notification.message}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Open the browser console and run <code>window.addNotification('Your message', 'info')</code> to add custom notifications.
        </p>
      </div>
    </div>
  );
};

export default NotificationTester;
