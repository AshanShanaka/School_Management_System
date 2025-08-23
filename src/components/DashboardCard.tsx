import Image from "next/image";
import Link from "next/link";

interface DashboardCardProps {
  title: string;
  count: number;
  icon: string;
  href: string;
  bgColor: string;
  textColor?: string;
  description?: string;
}

const DashboardCard = ({
  title,
  count,
  icon,
  href,
  bgColor,
  textColor = "text-white",
  description,
}: DashboardCardProps) => {
  return (
    <Link href={href} className="block">
      <div
        className={`${bgColor} ${textColor} rounded-xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Image src={icon} alt={title} width={24} height={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && (
                <p className="text-sm opacity-80">{description}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{count}</div>
            <div className="text-sm opacity-80">Total</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">View Details</span>
          <svg
            className="w-5 h-5"
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
    </Link>
  );
};

export default DashboardCard;
