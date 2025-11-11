"use client";

import Image from "next/image";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ModernDashboardCardProps {
  title: string;
  count: number | string;
  icon: string;
  href: string;
  gradient: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const ModernDashboardCard = ({
  title,
  count,
  icon,
  href,
  gradient,
  trend,
}: ModernDashboardCardProps) => {
  return (
    <Link href={href}>
      <div className={`relative overflow-hidden rounded-2xl ${gradient} p-6 text-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group`}>
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 opacity-10">
          <div className="w-32 h-32 rounded-full bg-white transform translate-x-8 -translate-y-8"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
              <Image src={icon} alt={title} width={24} height={24} className="brightness-0 invert" />
            </div>
            {trend && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.isPositive ? 'bg-green-400 bg-opacity-30' : 'bg-red-400 bg-opacity-30'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>
            <p className="text-3xl font-bold">{count}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ModernDashboardCard;
