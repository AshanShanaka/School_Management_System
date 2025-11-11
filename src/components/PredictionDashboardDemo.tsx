"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Brain,
  Users,
  Target,
  Minus,
} from "lucide-react";

interface PredictionResult {
  studentId: string;
  studentName: string;
  className: string;
  currentAverage: number;
  predictedScore: number;
  riskLevel: "high" | "medium" | "low";
  trend: "up" | "down" | "stable";
  historicalMarks: number[];
}

// Mock student data for demonstration
const MOCK_STUDENT: PredictionResult = {
  studentId: "STU001",
  studentName: "Kasun Perera",
  className: "Grade 11 - Science A",
  currentAverage: 72.5,
  predictedScore: 78.3,
  riskLevel: "low",
  trend: "up",
  historicalMarks: [68, 70, 71, 72, 73, 74, 75, 72, 73],
};

// Additional mock students for batch prediction
const MOCK_BATCH_STUDENTS: PredictionResult[] = [
  {
    studentId: "STU001",
    studentName: "Kasun Perera",
    className: "Grade 11 - Science A",
    currentAverage: 72.5,
    predictedScore: 78.3,
    riskLevel: "low",
    trend: "up",
    historicalMarks: [68, 70, 71, 72, 73, 74, 75, 72, 73],
  },
  {
    studentId: "STU002",
    studentName: "Nimali Fernando",
    className: "Grade 11 - Science A",
    currentAverage: 85.2,
    predictedScore: 87.5,
    riskLevel: "low",
    trend: "up",
    historicalMarks: [82, 83, 84, 85, 86, 85, 87, 85, 86],
  },
  {
    studentId: "STU003",
    studentName: "Dinesh Silva",
    className: "Grade 11 - Science B",
    currentAverage: 45.8,
    predictedScore: 48.2,
    riskLevel: "medium",
    trend: "up",
    historicalMarks: [42, 43, 44, 45, 46, 45, 47, 46, 47],
  },
  {
    studentId: "STU004",
    studentName: "Sachini Wickramasinghe",
    className: "Grade 11 - Arts A",
    currentAverage: 65.3,
    predictedScore: 62.8,
    riskLevel: "medium",
    trend: "down",
    historicalMarks: [68, 67, 66, 65, 64, 66, 65, 64, 65],
  },
  {
    studentId: "STU005",
    studentName: "Tharindu Rajapaksa",
    className: "Grade 11 - Commerce A",
    currentAverage: 35.6,
    predictedScore: 33.2,
    riskLevel: "high",
    trend: "down",
    historicalMarks: [38, 37, 36, 35, 34, 36, 35, 34, 36],
  },
];

export default function PredictionDashboardDemo() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [selectedView, setSelectedView] = useState<"single" | "batch">("single");
  const [showPrediction, setShowPrediction] = useState(false);

  const handleSinglePrediction = () => {
    setShowPrediction(true);
    setPredictions([MOCK_STUDENT]);
  };

  const handleBatchPrediction = () => {
    setShowPrediction(true);
    setPredictions(MOCK_BATCH_STUDENTS);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Target className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "stable":
        return <Minus className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatistics = () => {
    if (predictions.length === 0) return null;

    const highRisk = predictions.filter((p) => p.riskLevel === "high").length;
    const mediumRisk = predictions.filter((p) => p.riskLevel === "medium")
      .length;
    const lowRisk = predictions.filter((p) => p.riskLevel === "low").length;
    const avgPrediction =
      predictions.reduce((sum, p) => sum + p.predictedScore, 0) /
      predictions.length;

    return { highRisk, mediumRisk, lowRisk, avgPrediction };
  };

  const stats = getStatistics();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            AI Performance Prediction
          </h1>
          <p className="text-gray-500 mt-1">
            Machine learning-based student performance forecasting
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Demo Mode Active</p>
            <p className="text-sm text-blue-700">
              Showing predictions with sample data for demonstration purposes
            </p>
          </div>
        </div>
      </div>

      {/* View Selection */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            setSelectedView("single");
            setShowPrediction(false);
          }}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            selectedView === "single"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <p className="font-medium">Single Student</p>
          <p className="text-sm text-gray-500">Individual prediction</p>
        </button>
        <button
          onClick={() => {
            setSelectedView("batch");
            setShowPrediction(false);
          }}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            selectedView === "batch"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <p className="font-medium">Batch Prediction</p>
          <p className="text-sm text-gray-500">Multiple students</p>
        </button>
      </div>

      {/* Prediction Controls */}
      <div className="bg-white rounded-lg border p-6">
        {selectedView === "single" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Student
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="font-medium text-gray-900">
                  {MOCK_STUDENT.studentName}
                </p>
                <p className="text-sm text-gray-500">
                  {MOCK_STUDENT.className}
                </p>
              </div>
            </div>
            <button
              onClick={handleSinglePrediction}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Brain className="w-5 h-5" />
              Generate Prediction
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-gray-700">
                Generate predictions for <strong>5 sample students</strong>{" "}
                across different classes
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This will demonstrate batch prediction capabilities
              </p>
            </div>
            <button
              onClick={handleBatchPrediction}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Generate Batch Predictions
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {showPrediction && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {predictions.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.highRisk}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.mediumRisk}
                </p>
              </div>
              <Target className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Risk</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.lowRisk}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Predictions Table */}
      {showPrediction && predictions.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-900">Prediction Results</h2>
            <p className="text-sm text-gray-500">
              AI-generated performance forecasts based on historical data
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Avg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Predicted Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictions.map((prediction) => (
                  <tr key={prediction.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-medium">
                            {prediction.studentName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">
                            {prediction.studentName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {prediction.studentId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {prediction.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {prediction.currentAverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-purple-600">
                        {prediction.predictedScore.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(prediction.trend)}
                        <span className="text-sm font-medium capitalize">
                          {prediction.trend}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(
                          prediction.riskLevel
                        )}`}
                      >
                        {getRiskIcon(prediction.riskLevel)}
                        {prediction.riskLevel.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          How AI Prediction Works
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-purple-600 font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Data Collection</h4>
            <p className="text-sm text-gray-600">
              System analyzes last 9 assessment scores from student's
              performance history
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">
              AI Analysis
            </h4>
            <p className="text-sm text-gray-600">
              TensorFlow neural network processes patterns and trends in the
              data
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-green-600 font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">
              Prediction & Risk
            </h4>
            <p className="text-sm text-gray-600">
              Model predicts next term performance and calculates risk level
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
