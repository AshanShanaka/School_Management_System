import Image from "next/image";
import Link from "next/link";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  bgColor: string;
  iconBgColor: string;
}

const QuickActionCard = ({
  title,
  description,
  icon,
  href,
  bgColor,
  iconBgColor,
}: QuickActionCardProps) => {
  return (
    <Link href={href} className="block">
      <div
        className={`${bgColor} rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer border border-gray-200`}
      >
        <div className="flex items-start space-x-4">
          <div className={`${iconBgColor} rounded-lg p-3 flex-shrink-0`}>
            <Image src={icon} alt={title} width={24} height={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 text-sm mb-3">{description}</p>
            <div className="flex items-center text-blue-600 text-sm font-medium">
              <span>Access Now</span>
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default QuickActionCard;
