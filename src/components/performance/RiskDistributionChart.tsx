import { ClassStudentInsight, RiskLevel } from '@/types/performance';

interface RiskDistributionChartProps {
  insights: ClassStudentInsight[];
}

export default function RiskDistributionChart({
  insights,
}: RiskDistributionChartProps) {
  if (insights.length === 0) {
    return null;
  }

  // Count students by risk level
  const riskCounts = {
    LOW: insights.filter((i) => i.riskLevel === 'LOW').length,
    MEDIUM: insights.filter((i) => i.riskLevel === 'MEDIUM').length,
    HIGH: insights.filter((i) => i.riskLevel === 'HIGH').length,
  };

  const total = insights.length;

  const getRiskPercentage = (count: number) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  };

  const riskData = [
    {
      label: 'On Track',
      count: riskCounts.LOW,
      percentage: getRiskPercentage(riskCounts.LOW),
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    {
      label: 'Needs Attention',
      count: riskCounts.MEDIUM,
      percentage: getRiskPercentage(riskCounts.MEDIUM),
      color: 'bg-amber-500',
      lightColor: 'bg-amber-100',
      textColor: 'text-amber-700',
    },
    {
      label: 'At Risk',
      count: riskCounts.HIGH,
      percentage: getRiskPercentage(riskCounts.HIGH),
      color: 'bg-red-500',
      lightColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
  ];

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <header className="mb-6">
        <h2 className="text-lg font-semibold">Class Risk Distribution</h2>
        <p className="text-sm text-gray-600 mt-1">
          Overview of student performance predictions ({total} students)
        </p>
      </header>

      {/* Bar Chart */}
      <div className="space-y-4 mb-6">
        {riskData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">{item.label}</span>
              <span className="text-sm text-gray-600">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className={`w-full h-8 ${item.lightColor} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${item.color} transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${item.percentage}%` }}
              >
                {parseFloat(item.percentage) > 10 && (
                  <span className="text-white text-xs font-bold">
                    {item.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {riskData.map((item, index) => (
          <article
            key={index}
            className={`${item.lightColor} rounded-lg p-4 text-center`}
          >
            <p className={`text-3xl font-bold ${item.textColor}`}>
              {item.count}
            </p>
            <p className="text-sm text-gray-700 font-medium mt-1">
              {item.label}
            </p>
            <p className="text-xs text-gray-600 mt-1">{item.percentage}%</p>
          </article>
        ))}
      </div>
    </section>
  );
}
