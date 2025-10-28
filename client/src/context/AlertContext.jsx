import { createContext, useContext, useState } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    autoClose: false,
    autoCloseDelay: 3000
  });

  const showAlert = (options) => {
    setAlert({
      isOpen: true,
      type: 'info',
      title: '',
      message: '',
      showCancel: false,
      onConfirm: null,
      onCancel: null,
      confirmText: 'OK',
      cancelText: 'Cancel',
      autoClose: false,
      autoCloseDelay: 3000,
      ...options
    });
  };

  const showSuccess = (message, options = {}) => {
    showAlert({
      type: 'success',
      message,
      autoClose: true,
      ...options
    });
  };

  const showError = (message, options = {}) => {
    showAlert({
      type: 'error',
      message,
      ...options
    });
  };

  const showWarning = (message, options = {}) => {
    showAlert({
      type: 'warning',
      message,
      ...options
    });
  };

  const showInfo = (message, options = {}) => {
    showAlert({
      type: 'info',
      message,
      autoClose: true,
      ...options
    });
  };

  const showConfirm = (message, onConfirm, options = {}) => {
    showAlert({
      type: 'warning',
      message,
      showCancel: true,
      onConfirm,
      confirmText: 'Yes',
      cancelText: 'No',
      ...options
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const value = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    hideAlert
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Alert
        isOpen={alert.isOpen}
        onClose={hideAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        showCancel={alert.showCancel}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        autoClose={alert.autoClose}
        autoCloseDelay={alert.autoCloseDelay}
      />
    </AlertContext.Provider>
  );
};

export default AlertContext;
