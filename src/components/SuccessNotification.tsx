"use client";

import { useEffect, useState } from 'react';

interface SuccessNotificationProps {
  title: string;
  message: string;
  onClose: () => void;
}

export default function SuccessNotification({ title, message, onClose }: SuccessNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);

    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ minWidth: '320px' }}
    >
      {/* Success Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="font-bold text-lg">{title}</div>
        <div className="text-sm text-green-50">{message}</div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-20 flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-20 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-[4000ms] ease-linear"
          style={{ width: isVisible ? '0%' : '100%' }}
        />
      </div>
    </div>
  );
}
