"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProfileDropdownProps {
  user: {
    name: string;
    surname: string;
    role: string;
  } | null;
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Info and Avatar */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right">
          <span className="text-xs leading-3 font-medium">
            {user ? `${user.name} ${user.surname}` : "Guest"}
          </span>
          <span className="text-[10px] text-gray-500 capitalize">
            {user?.role || ""}
          </span>
        </div>
        
        {/* Profile Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
          type="button"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Image
            src="/avatar.png"
            alt="Profile"
            width={36}
            height={36}
            className="rounded-full border-2 border-gray-300 hover:border-blue-500 transition duration-150 cursor-pointer"
          />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1">
          <Link
            href="/profile"
            className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Image src="/profile.png" alt="Profile" width={16} height={16} />
            Profile
          </Link>
          
          <Link
            href="/settings"
            className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Image src="/setting.png" alt="Settings" width={16} height={16} />
            Settings
          </Link>
          
          <hr className="my-1 border-gray-200" />
          
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors text-left"
          >
            <Image src="/logout.png" alt="Logout" width={16} height={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
