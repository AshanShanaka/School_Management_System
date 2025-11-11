"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  LineChart,
  Users,
  Target,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { formatClassName } from "@/lib/formatClassName";

interface Student {
  id: string;
  name: string;
  surname: string;
  classId: number;
  class: {
    name: string;
  };
}

interface PredictionResult {
  studentId: string;
  studentName: string;
  className: string;
  prediction: number;
  riskLevel: "low" | "medium" | "high";
  currentAverage?: number;
}

const PredictionDashboard = ({ userRole }: { userRole: string }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [flaskStatus, setFlaskStatus] = useState<"checking" | "online" | "offline">("checking");

  // Check Flask API status
  useEffect(() => {
    checkFlaskStatus();
  }, []);

  const checkFlaskStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/predict/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: [75, 80, 70, 85, 78, 82, 88, 76, 79] }),
      });
      
      if (response.ok) {
        setFlaskStatus("online");
      } else {
        setFlaskStatus("offline");
      }
    } catch (error) {
      setFlaskStatus("offline");
    }
  };

  // Fetch students
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/students");
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  // Get student's historical marks from exam results
  const getStudentMarks = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/exam-history`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam history");
      }
      const data = await response.json();
      return data.marks || [];
    } catch (error) {
      console.error("Error fetching marks:", error);
      return [];
    }
  };

  // Predict performance for a single student
  const predictSingleStudent = async (studentId: string) => {
    setPredicting(true);
    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) {
        toast.error("Student not found");
        return;
      }

      // Get student's historical marks (last 9 terms/assessments)
      const historicalMarks = await getStudentMarks(studentId);
      
      if (historicalMarks.length === 0) {
        toast.error("No historical data available for prediction");
        setPredicting(false);
        return;
      }

      // Prepare marks array (need 9 values for the model)
      const marksArray = historicalMarks.slice(0, 9);
      
      // Pad with average if less than 9
      while (marksArray.length < 9) {
        const avg = marksArray.reduce((a, b) => a + b, 0) / marksArray.length;
        marksArray.push(avg);
      }

      // Call Flask ML API
      const response = await fetch("http://localhost:5000/predict/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: marksArray }),
      });

      if (!response.ok) {
        throw new Error("Prediction failed");
      }

      const data = await response.json();
      const prediction = data.prediction;

      // Calculate risk level
      let riskLevel: "low" | "medium" | "high" = "low";
      if (prediction < 40) riskLevel = "high";
      else if (prediction < 60) riskLevel = "medium";

      const currentAverage = marksArray.reduce((a, b) => a + b, 0) / marksArray.length;

      const result: PredictionResult = {
        studentId: student.id,
        studentName: `${student.name} ${student.surname}`,
        className: formatClassName(student.class.name),
        prediction: prediction,
        riskLevel: riskLevel,
        currentAverage: currentAverage,
      };

      setPredictions([result, ...predictions]);
      toast.success(`Prediction generated for ${student.name} ${student.surname}`);
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error("Failed to generate prediction. Ensure Flask API is running.");
    } finally {
      setPredicting(false);
    }
  };

  // Predict for all students
  const predictAllStudents = async () => {
    if (students.length === 0) {
      toast.error("No students available");
      return;
    }

    setPredicting(true);
    const results: PredictionResult[] = [];

    try {
      for (const student of students.slice(0, 20)) { // Limit to first 20 for demo
        const historicalMarks = await getStudentMarks(student.id);
        
        if (historicalMarks.length === 0) continue;

        const marksArray = historicalMarks.slice(0, 9);
        while (marksArray.length < 9) {
          const avg = marksArray.reduce((a, b) => a + b, 0) / marksArray.length;
          marksArray.push(avg);
        }

        const response = await fetch("http://localhost:5000/predict/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marks: marksArray }),
        });

        if (response.ok) {
          const data = await response.json();
          const prediction = data.prediction;

          let riskLevel: "low" | "medium" | "high" = "low";
          if (prediction < 40) riskLevel = "high";
          else if (prediction < 60) riskLevel = "medium";

          results.push({
            studentId: student.id,
            studentName: `${student.name} ${student.surname}`,
            className: formatClassName(student.class.name),
            prediction: prediction,
            riskLevel: riskLevel,
            currentAverage: marksArray.reduce((a, b) => a + b, 0) / marksArray.length,
          });
        }
      }

      setPredictions(results);
      toast.success(`Generated predictions for ${results.length} students`);
    } catch (error) {
      console.error("Batch prediction error:", error);
      toast.error("Failed to generate predictions");
    } finally {
      setPredicting(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "medium":
        return <TrendingUp className="w-5 h-5 text-yellow-600" />;
      case "low":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Flask API Status */}
      <div className={`p-4 rounded-lg border ${
        flaskStatus === "online" 
          ? "bg-green-50 border-green-200" 
          : flaskStatus === "offline"
          ? "bg-red-50 border-red-200"
          : "bg-yellow-50 border-yellow-200"
      }`}>
        <div className="flex items-center gap-3">
          {flaskStatus === "checking" && <Loader2 className="w-5 h-5 animate-spin" />}
          {flaskStatus === "online" && <CheckCircle className="w-5 h-5 text-green-600" />}
          {flaskStatus === "offline" && <AlertTriangle className="w-5 h-5 text-red-600" />}
          <div>
            <p className="font-semibold">
              ML Prediction Service: {flaskStatus === "online" ? "Online" : flaskStatus === "offline" ? "Offline" : "Checking..."}
            </p>
            {flaskStatus === "offline" && (
              <p className="text-sm text-red-600 mt-1">
                Please start the Flask API: <code className="bg-red-100 px-2 py-1 rounded">cd Predict && python api.py</code>
              </p>
            )}
            {flaskStatus === "online" && (
              <p className="text-sm text-green-600 mt-1">
                Running on http://localhost:5000
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Predictions Made</p>
              <p className="text-2xl font-bold">{predictions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold">
                {predictions.filter((p) => p.riskLevel === "high").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ML Model</p>
              <p className="text-sm font-semibold">TensorFlow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Generate Predictions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Single Student Prediction */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Predict for Single Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || predicting || flaskStatus !== "online"}
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} {student.surname} - {formatClassName(student.class.name)}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedStudent && predictSingleStudent(selectedStudent)}
              disabled={!selectedStudent || predicting || flaskStatus !== "online"}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {predicting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Predict Performance
                </>
              )}
            </button>
          </div>

          {/* Batch Prediction */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Batch Prediction
            </label>
            <p className="text-sm text-gray-600">
              Generate predictions for all students (first 20)
            </p>
            <button
              onClick={predictAllStudents}
              disabled={predicting || students.length === 0 || flaskStatus !== "online"}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {predicting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <LineChart className="w-4 h-4" />
                  Predict All Students
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Prediction Results */}
      {predictions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Prediction Results ({predictions.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Student
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Class
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Current Avg
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Predicted Score
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Risk Level
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, index) => {
                  const trend = pred.currentAverage 
                    ? pred.prediction - pred.currentAverage 
                    : 0;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{pred.studentName}</td>
                      <td className="py-3 px-4 text-gray-600">{pred.className}</td>
                      <td className="py-3 px-4">
                        {pred.currentAverage?.toFixed(1) || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-lg">
                          {pred.prediction.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(
                            pred.riskLevel
                          )}`}
                        >
                          {getRiskIcon(pred.riskLevel)}
                          {pred.riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {trend !== 0 && (
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${
                              trend > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          How AI Prediction Works
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Uses TensorFlow deep learning model trained on historical student data</li>
          <li>• Analyzes last 9 assessment scores to predict next term performance</li>
          <li>• Risk levels: High (&lt;40), Medium (40-60), Low (&gt;60)</li>
          <li>• Helps identify students who need additional support</li>
          <li>• Predictions are probabilistic and should be used as guidance</li>
        </ul>
      </div>
    </div>
  );
};

export default PredictionDashboard;
