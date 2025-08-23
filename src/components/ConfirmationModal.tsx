"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2, CheckCircle, XCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger",
  loading = false,
}: ConfirmationModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
  };

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          icon: AlertTriangle,
          confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          borderColor: "border-red-200",
        };
      case "warning":
        return {
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          icon: AlertTriangle,
          confirmBtn: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          borderColor: "border-yellow-200",
        };
      case "info":
        return {
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          icon: CheckCircle,
          confirmBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          borderColor: "border-blue-200",
        };
      default:
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          icon: AlertTriangle,
          confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          borderColor: "border-red-200",
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = styles.icon;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          } w-full max-w-md`}
        >
          {/* Header */}
          <div className={`border-b ${styles.borderColor} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.iconBg}`}
                >
                  <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`inline-flex w-full justify-center items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto ${styles.confirmBtn}`}
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              <Trash2 className="h-4 w-4" />
              <span>{loading ? "Deleting..." : confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
