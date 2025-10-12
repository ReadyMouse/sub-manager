import { useState, useCallback } from 'react';
import type { ToastNotification } from '../lib/types';
import { generateId } from '../lib/utils';

const TOAST_DURATION = 5000; // 5 seconds

/**
 * Hook for managing toast notifications
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((
    type: ToastNotification['type'],
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = generateId();
    const toast: ToastNotification = {
      id,
      type,
      title,
      message,
      duration: duration || TOAST_DURATION,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message: string) => {
    return addToast('success', title, message);
  }, [addToast]);

  const error = useCallback((title: string, message: string) => {
    return addToast('error', title, message);
  }, [addToast]);

  const info = useCallback((title: string, message: string) => {
    return addToast('info', title, message);
  }, [addToast]);

  const warning = useCallback((title: string, message: string) => {
    return addToast('warning', title, message);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
};

