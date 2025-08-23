"use client";

import { Edit, MoreVertical } from "lucide-react";
import { useState } from "react";

interface EditButtonProps {
  onEdit: () => void;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "dropdown" | "button";
  disabled?: boolean;
  tooltip?: string;
}

const EditButton = ({
  onEdit,
  loading = false,
  size = "md",
  variant = "icon",
  disabled = false,
  tooltip = "Edit",
}: EditButtonProps) => {
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
        return 12;
      case "md":
        return 14;
      case "lg":
        return 16;
      default:
        return 14;
    }
  };

  if (variant === "dropdown") {
    return (
      <div className="relative">
        <button
          onClick={onEdit}
          disabled={disabled || loading}
          className={`${getSizeStyles()} flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          ) : (
            <MoreVertical size={getIconSize()} className="text-white" />
          )}
        </button>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>
    );
  }

  if (variant === "button") {
    return (
      <div className="relative">
        <button
          onClick={onEdit}
          disabled={disabled || loading}
          className={`${getSizeStyles()} flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          ) : (
            <Edit size={getIconSize()} className="text-white" />
          )}
        </button>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        )}
      </div>
    );
  }

  // Default icon variant
  return (
    <div className="relative">
      <button
        onClick={onEdit}
        disabled={disabled || loading}
        className={`${getSizeStyles()} flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
        ) : (
          <Edit size={getIconSize()} className="text-white" />
        )}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default EditButton;
