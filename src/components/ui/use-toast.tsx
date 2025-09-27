"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  type = "info",
  duration = 5000,
  onClose,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "border-green-500 bg-green-900/20 text-green-100";
      case "error":
        return "border-red-500 bg-red-900/20 text-red-100";
      case "warning":
        return "border-yellow-500 bg-yellow-900/20 text-yellow-100";
      default:
        return "border-blue-500 bg-blue-900/20 text-blue-100";
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full 
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        animate-in slide-in-from-top-2 fade-in duration-300
        ${getStyles()}
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm mb-1">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback(
    (props: Omit<ToastProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { ...props, id, onClose: removeToast }]);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = React.useMemo(
    () =>
      function ToastContainer() {
        return (
          <>
            {toasts.map((toastProps) => (
              <Toast key={toastProps.id} {...toastProps} />
            ))}
          </>
        );
      },
    [toasts]
  );

  return {
    toast,
    ToastContainer,
  };
};
