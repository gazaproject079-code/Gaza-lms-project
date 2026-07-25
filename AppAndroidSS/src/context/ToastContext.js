import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from '../components/ui/Toast';

// Section 20 - Toast Notifications
// Global toast management context

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', title, message, autoDismiss = true, position = 'top-right' }) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message, autoDismiss, position, visible: true }]);
    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((title, message) => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((title, message) => {
    return showToast({ type: 'error', title, message });
  }, [showToast]);

  const warning = useCallback((title, message) => {
    return showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((title, message) => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            visible={toast.visible}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            autoDismiss={toast.autoDismiss}
            position={toast.position}
            onDismiss={() => hideToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
});

export default ToastContext;
