"use client";

import { Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

interface DeleteButtonProps {
  onDelete: () => void;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "dropdown" | "button";
  disabled?: boolean;
  tooltip?: string;
}

const DeleteButton = ({
  onDelete,
  loading = false,
  size = "md",
  variant = "icon",
  disabled = false,
  tooltip = "Delete",
}: DeleteButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "w-6 h-6";
      case "md":
        return "w-7 h-7";
      case "lg":
        return "w-8 h-8";
      default:
        return "w-7 h-7";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-4 h-4";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  if (variant === "button") {
    return (
      <button
        onClick={onDelete}
        disabled={disabled || loading}
        className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        <span>{loading ? "Deleting..." : "Delete"}</span>
      </button>
    );
  }

  if (variant === "dropdown") {
    return (
      <button
        onClick={onDelete}
        disabled={disabled || loading}
        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 focus:outline-none focus:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        <span>{loading ? "Deleting..." : "Delete"}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onDelete}
        disabled={disabled || loading}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${getSizeStyles()} flex items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95`}
      >
        {loading ? (
          <div
            className={`animate-spin rounded-full border-2 border-red-600 border-t-transparent ${getIconSize()}`}
          />
        ) : (
          <Trash2 className={`${getIconSize()}`} />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !loading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default DeleteButton;
