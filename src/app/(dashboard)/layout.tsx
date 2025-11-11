import MenuCompact from "@/components/MenuCompact";
import Navbar from "@/components/Navbar";
import NotificationAlert from "@/components/NotificationAlert";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex bg-gray-50">
      <NotificationAlert />
      
      {/* LEFT SIDEBAR - Simple & Professional */}
      <div className="w-16 lg:w-60 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo - Clean & Minimal */}
        <div className="h-14 px-4 border-b border-gray-100 flex items-center justify-center lg:justify-start shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo.png"
              alt="logo"
              width={28}
              height={28}
            />
            <span className="hidden lg:block font-semibold text-gray-900 text-base">
              EduNova
            </span>
          </Link>
        </div>
        
        {/* Menu - Clean Scrollbar */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <MenuCompact />
        </div>
      </div>
      
      {/* RIGHT - Main Content */}
      <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
