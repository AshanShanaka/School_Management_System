'use client';
import { useEffect, useState } from 'react';

export default function StudentOLPrediction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/predictions/student')
      .then(r => r.json())
      .then(res => { 
        console.log('API Response:', res);
        setData(res.data || res); 
        setLoading(false); 
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">Loading predictions...</div>;
  if (!data) return <div className="p-6">No data available</div>;

  // Calculate metrics from actual API data
  const passCount = data.subject_predictions?.filter(s => s.predicted_mark >= 35).length || 0;
  const atRiskCount = data.subject_predictions?.filter(s => s.predicted_mark < 50).length || 0;
  const excellentCount = data.subject_predictions?.filter(s => s.predicted_mark >= 75).length || 0;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 shadow-xl text-white">
        <h1 className="text-4xl font-bold mb-2">O/L Prediction Dashboard</h1>
        <p className="text-blue-100 text-lg">AI-Powered Performance Analysis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600 mb-2">Predicted Average</div>
          <div className="text-4xl font-bold text-gray-800">{data.overall_average?.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-2">Overall Performance</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-2">Pass Probability</div>
          <div className="text-4xl font-bold text-gray-800">{((data.pass_probability || 0) * 100).toFixed(0)}%</div>
          <div className="text-xs text-gray-500 mt-2">Success Rate</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600 mb-2">Attendance</div>
          <div className="text-4xl font-bold text-gray-800">{data.attendance_percentage?.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 mt-2">Class Attendance</div>
        </div>

        <div className={`rounded-xl p-6 shadow-lg border-l-4 ${
          data.risk_level === 'LOW' ? 'bg-green-50 border-green-500' :
          data.risk_level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
          'bg-red-50 border-red-500'
        }`}>
          <div className="text-sm font-medium text-gray-600 mb-2">Risk Level</div>
          <div className={`text-4xl font-bold ${
            data.risk_level === 'LOW' ? 'text-green-600' :
            data.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
          }`}>{data.risk_level}</div>
          <div className="text-xs text-gray-500 mt-2">{data.risk_status || 'Overall Risk'}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">Subject Performance Analysis</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Current</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Predicted</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Change</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Trend</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.subject_predictions?.map((subject, i) => {
                  const change = subject.predicted_mark - subject.current_average;
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-semibold text-gray-800">{subject.subject}</td>
                      <td className="text-center py-4 px-4 text-gray-600">{subject.current_average?.toFixed(1)}%</td>
                      <td className="text-center py-4 px-4 font-bold text-blue-600 text-lg">{subject.predicted_mark?.toFixed(1)}%</td>
                      <td className={`text-center py-4 px-4 font-bold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? '' : ''} {Math.abs(change).toFixed(1)}%
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          subject.predicted_grade === 'A' ? 'bg-green-100 text-green-800' :
                          subject.predicted_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          subject.predicted_grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          subject.predicted_grade === 'S' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {subject.predicted_grade}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={`font-semibold ${
                          subject.trend === 'improving' ? 'text-green-600' :
                          subject.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {subject.trend === 'improving' ? ' Up' :
                           subject.trend === 'declining' ? ' Down' : ' Stable'}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${
                              subject.confidence > 0.8 ? 'bg-green-500' :
                              subject.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} style={{ width: `${subject.confidence * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold">{(subject.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{excellentCount}</div>
              <div className="text-sm text-gray-600 mt-1">Excellent (75%)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{passCount}</div>
              <div className="text-sm text-gray-600 mt-1">Passing (35%)</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{atRiskCount}</div>
              <div className="text-sm text-gray-600 mt-1">Needs Focus (&lt;50%)</div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Gauge */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Risk Assessment</h3>
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-24 mb-4">
                <div className="absolute inset-0 flex items-end justify-center">
                  <div className="w-full h-12 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-t-full"></div>
                </div>
                <div className="absolute inset-0 flex items-end justify-center">
                  <div className="absolute bottom-0 w-1.5 h-20 bg-gray-800 origin-bottom rounded-full"
                    style={{
                      left: '50%',
                      transform: `rotate(${(data.pass_probability || 0) * 180 - 90}deg) translateX(-50%)`,
                      transformOrigin: 'bottom center'
                    }}></div>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  data.risk_level === 'LOW' ? 'text-green-600' :
                  data.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {data.risk_level}
                </div>
                <div className="text-sm text-gray-600">
                  {((data.pass_probability || 0) * 100).toFixed(0)}% Success Rate
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4"> AI Recommendations</h3>
              <ul className="space-y-3">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                    <span className="text-purple-600 text-lg font-bold"></span>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Grading Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ℹ Grading System</h3>
            <div className="space-y-2 text-sm">
              {[
                { grade: 'A', range: '75-100%', color: 'green' },
                { grade: 'B', range: '65-74%', color: 'blue' },
                { grade: 'C', range: '50-64%', color: 'yellow' },
                { grade: 'S', range: '35-49%', color: 'orange' },
                { grade: 'W', range: '0-34%', color: 'red' }
              ].map(({ grade, range, color }) => (
                <div key={grade} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className={`px-3 py-1 rounded-full font-bold text-xs bg-${color}-100 text-${color}-800`}>
                    Grade {grade}
                  </span>
                  <span className={`font-bold text-${color}-600 text-sm`}>{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-3"> Understanding Your Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
          <div className="bg-white p-3 rounded-lg">
            <strong>Predicted Marks:</strong> AI-generated based on performance trends and attendance
          </div>
          <div className="bg-white p-3 rounded-lg">
            <strong>Confidence Level:</strong> Higher confidence = more reliable prediction
          </div>
          <div className="bg-white p-3 rounded-lg">
            <strong>Trend Indicators:</strong>  Improving /  Declining /  Stable
          </div>
          <div className="bg-white p-3 rounded-lg">
            <strong>Pass Line:</strong> 35% is minimum for O/L subjects
          </div>
        </div>
      </div>
    </div>
  );
}
