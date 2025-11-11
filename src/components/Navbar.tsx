import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import NotificationDropdown from "./NotificationDropdown";
import MessageNotification from "./MessageNotification";
import ProfileDropdown from "./ProfileDropdown";

const Navbar = async () => {
  const user = await getCurrentUser();
  const role = user?.role || "";

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-soft">
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* SEARCH BAR */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg 
                         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 
                         focus:border-transparent focus:bg-white placeholder:text-neutral-400"
            />
            <kbd className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 
                           items-center gap-1 px-1.5 py-0.5 bg-white border border-neutral-300 
                           rounded text-[10px] font-medium text-neutral-600">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>
        
        {/* ICONS AND USER */}
        <div className="flex items-center gap-4 ml-auto">
          <MessageNotification />
          <NotificationDropdown />
          <div className="h-6 w-px bg-neutral-300"></div>
          <ProfileDropdown user={user} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
