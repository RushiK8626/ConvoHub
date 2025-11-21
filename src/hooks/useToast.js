import { useState, useCallback } from "react";

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = toastId++;
      const newToast = { id, message, type, duration };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      return id;
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message, duration) => {
      return showToast(message, "success", duration);
    },
    [showToast]
  );

  const showError = useCallback(
    (message, duration) => {
      return showToast(message, "error", duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message, duration) => {
      return showToast(message, "info", duration);
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showInfo,
    removeToast,
  };
};
