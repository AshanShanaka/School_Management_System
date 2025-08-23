import React from "react";

interface ImportProgressProps {
  progress: number;
  total: number;
  errors: number;
  isComplete: boolean;
}

const ImportProgress: React.FC<ImportProgressProps> = ({
  progress,
  total,
  errors,
  isComplete,
}) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Import Progress</h3>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Progress: {progress} / {total}
          </span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isComplete
                ? errors > 0
                  ? "bg-yellow-500"
                  : "bg-green-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">{progress}</div>
          <div className="text-xs text-gray-500">Processed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{errors}</div>
          <div className="text-xs text-gray-500">Errors</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {total - progress}
          </div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
      </div>

      {isComplete && (
        <div className="mt-4 p-3 rounded bg-gray-50">
          <p className="text-sm text-gray-600">
            Import completed
            {errors > 0 ? ` with ${errors} errors` : " successfully"}!
          </p>
        </div>
      )}
    </div>
  );
};

export default ImportProgress;
