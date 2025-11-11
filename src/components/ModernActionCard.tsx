"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ModernActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  iconBgColor: string;
}

const ModernActionCard = ({
  title,
  description,
  icon,
  href,
  iconBgColor,
}: ModernActionCardProps) => {
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-300 border border-gray-100 group cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <Image src={icon} alt={title} width={22} height={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  );
};

export default ModernActionCard;
