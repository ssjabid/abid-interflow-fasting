import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import AlertModal from "../components/ui/AlertModal";

interface AlertOptions {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isVisible: boolean;
    options: AlertOptions;
  }>({
    isVisible: false,
    options: {
      title: "",
      message: "",
    },
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      isVisible: true,
      options,
    });
  }, []);

  const showSuccess = useCallback(
    (title: string, message: string) => {
      showAlert({ title, message, type: "success" });
    },
    [showAlert],
  );

  const showError = useCallback(
    (title: string, message: string) => {
      showAlert({ title, message, type: "error" });
    },
    [showAlert],
  );

  const showWarning = useCallback(
    (title: string, message: string) => {
      showAlert({ title, message, type: "warning" });
    },
    [showAlert],
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
    ) => {
      showAlert({
        title,
        message,
        type: "warning",
        showCancel: true,
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm,
        onCancel,
      });
    },
    [showAlert],
  );

  const handleConfirm = () => {
    setAlertState((prev) => ({ ...prev, isVisible: false }));
    alertState.options.onConfirm?.();
  };

  const handleCancel = () => {
    setAlertState((prev) => ({ ...prev, isVisible: false }));
    alertState.options.onCancel?.();
  };

  return (
    <AlertContext.Provider
      value={{ showAlert, showSuccess, showError, showWarning, showConfirm }}
    >
      {children}
      <AlertModal
        isVisible={alertState.isVisible}
        title={alertState.options.title}
        message={alertState.options.message}
        type={alertState.options.type}
        confirmText={alertState.options.confirmText}
        cancelText={alertState.options.cancelText}
        showCancel={alertState.options.showCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}
