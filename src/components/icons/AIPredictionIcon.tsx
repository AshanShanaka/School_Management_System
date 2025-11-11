import React from 'react';

interface AIPredictionIconProps {
  className?: string;
  size?: number;
}

const AIPredictionIcon: React.FC<AIPredictionIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Brain/Neural Network Shape */}
      <path
        d="M12 3C10.3431 3 9 4.34315 9 6V7C7.34315 7 6 8.34315 6 10V11C4.34315 11 3 12.3431 3 14C3 15.6569 4.34315 17 6 17V18C6 19.6569 7.34315 21 9 21V22C10.3431 22 12 22 12 22C12 22 13.6569 22 15 22V21C16.6569 21 18 19.6569 18 18V17C19.6569 17 21 15.6569 21 14C21 12.3431 19.6569 11 18 11V10C18 8.34315 16.6569 7 15 7V6C15 4.34315 13.6569 3 12 3Z"
        stroke="#8b5cf6"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#f3e8ff"
        opacity="0.8"
      />
      
      {/* Central Node */}
      <circle cx="12" cy="14" r="2.5" fill="#8b5cf6" />
      
      {/* Neural Network Nodes */}
      <circle cx="8" cy="10" r="1.8" fill="#a78bfa" />
      <circle cx="16" cy="10" r="1.8" fill="#a78bfa" />
      <circle cx="8" cy="18" r="1.8" fill="#a78bfa" />
      <circle cx="16" cy="18" r="1.8" fill="#a78bfa" />
      
      {/* Connection Lines */}
      <line x1="12" y1="14" x2="8" y2="10" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.5" />
      <line x1="12" y1="14" x2="16" y2="10" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.5" />
      <line x1="12" y1="14" x2="8" y2="18" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.5" />
      <line x1="12" y1="14" x2="16" y2="18" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.5" />
      
      {/* Sparkle/AI Effect */}
      <circle cx="12" cy="6" r="1" fill="#fbbf24" opacity="0.8" />
      <circle cx="6" cy="14" r="0.8" fill="#fbbf24" opacity="0.6" />
      <circle cx="18" cy="14" r="0.8" fill="#fbbf24" opacity="0.6" />
    </svg>
  );
};

export default AIPredictionIcon;
