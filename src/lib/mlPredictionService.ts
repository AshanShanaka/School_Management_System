/**
 * ML Prediction Service
 * Handles communication with Python ML API for O/L grade predictions
 */

import { OLGrade, RiskLevel } from '@/types/performance';

// ML API Configuration
const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://127.0.0.1:5000';

export interface SubjectPrediction {
  subject: string;
  current_average: number;
  predicted_mark: number;
  predicted_grade: OLGrade;
  confidence: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface StudentPredictionResponse {
  success: boolean;
  data: {
    subject_predictions: SubjectPrediction[];
    overall_average: number;
    risk_level: RiskLevel;
    risk_status: string;
    pass_probability: number;
    attendance_percentage: number;
    total_subjects: number;
    recommendations: string[];
  };
}

export interface ClassPredictionResponse {
  success: boolean;
  class_summary: {
    total_students: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    class_average: number;
    high_risk_percentage: number;
  };
  student_predictions: Array<{
    student_id: string;
    name: string;
    prediction: StudentPredictionResponse['data'];
  }>;
}

export interface SubjectAnalysisResponse {
  success: boolean;
  subject_summary: {
    subject_name: string;
    total_students: number;
    average_predicted: number;
    grade_distribution: Record<OLGrade, number>;
    pass_rate: number;
  };
  student_predictions: Array<{
    student_id: string;
    name: string;
    current_average: number;
    predicted_mark: number;
    predicted_grade: OLGrade;
    confidence: number;
    attendance: number;
  }>;
}

export interface BulkPredictionResponse {
  success: boolean;
  school_summary: {
    total_students: number;
    total_classes: number;
    school_average: number;
    total_high_risk: number;
    total_medium_risk: number;
    total_low_risk: number;
    high_risk_percentage: number;
  };
  class_predictions: Array<{
    class_id: string;
    class_name: string;
    total_students: number;
    class_average: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    students: Array<{
      student_id: string;
      name: string;
      overall_average: number;
      risk_level: RiskLevel;
    }>;
  }>;
}

/**
 * Check if ML API is available
 */
export async function checkMLApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'online' && data.model_loaded === true;
  } catch (error) {
    console.error('ML API health check failed:', error);
    return false;
  }
}

/**
 * Get predictions for a single student
 */
export async function predictStudent(
  subjects: Array<{ name: string; marks: number[] }>,
  attendance: number
): Promise<StudentPredictionResponse | null> {
  try {
    const response = await fetch(`${ML_API_URL}/api/predict/student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subjects,
        attendance,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting student performance:', error);
    return null;
  }
}

/**
 * Get predictions for entire class
 */
export async function predictClass(
  students: Array<{
    student_id: string;
    name: string;
    subjects: Array<{ name: string; marks: number[] }>;
    attendance: number;
  }>
): Promise<ClassPredictionResponse | null> {
  try {
    const response = await fetch(`${ML_API_URL}/api/predict/class`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        students,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting class performance:', error);
    return null;
  }
}

/**
 * Get predictions for specific subject across students
 */
export async function predictSubject(
  subjectName: string,
  students: Array<{
    student_id: string;
    name: string;
    marks: number[];
    attendance: number;
  }>
): Promise<SubjectAnalysisResponse | null> {
  try {
    const response = await fetch(`${ML_API_URL}/api/predict/subject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject_name: subjectName,
        students,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting subject performance:', error);
    return null;
  }
}

/**
 * Get bulk predictions for admin view (all classes)
 */
export async function predictBulk(
  classes: Array<{
    class_id: string;
    class_name: string;
    students: Array<{
      student_id: string;
      name: string;
      subjects: Array<{ name: string; marks: number[] }>;
      attendance: number;
    }>;
  }>
): Promise<BulkPredictionResponse | null> {
  try {
    const response = await fetch(`${ML_API_URL}/api/predict/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classes,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting bulk performance:', error);
    return null;
  }
}

/**
 * Calculate risk level from predicted average
 */
export function calculateRiskLevel(predictedAverage: number): RiskLevel {
  if (predictedAverage >= 65) {
    return 'LOW';
  } else if (predictedAverage >= 50) {
    return 'MEDIUM';
  } else {
    return 'HIGH';
  }
}

/**
 * Get recommendations based on risk level and trend
 */
export function getRecommendations(
  riskLevel: RiskLevel,
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE'
): string[] {
  const recommendations: string[] = [];

  // Risk-based recommendations
  switch (riskLevel) {
    case 'HIGH':
      recommendations.push('🚨 Immediate intervention required');
      recommendations.push('📚 Consider extra tutoring sessions');
      recommendations.push('👥 Arrange parent-teacher meeting');
      break;
    case 'MEDIUM':
      recommendations.push('⚠️ Monitor progress closely');
      recommendations.push('📖 Additional practice recommended');
      break;
    case 'LOW':
      recommendations.push('✅ Maintain current performance');
      recommendations.push('🎯 Focus on excellence');
      break;
  }

  // Trend-based recommendations
  if (trend === 'DECLINING') {
    recommendations.push('📉 Address declining performance immediately');
  } else if (trend === 'IMPROVING') {
    recommendations.push('📈 Excellent progress! Keep it up');
  }

  return recommendations;
}

/**
 * Format prediction data for subject-wise analysis
 */
export async function getSubjectPredictions(
  subjectMarksMap: Map<number, { name: string; marks: number[] }>,
  attendanceRate: number
): Promise<SubjectPrediction[]> {
  const subjects = Array.from(subjectMarksMap.values()).map((subject) => ({
    name: subject.name,
    marks: subject.marks,
  }));

  const response = await predictStudent(subjects, attendanceRate);

  if (!response || !response.success) {
    return [];
  }

  return response.data.subject_predictions.map((pred) => ({
    subject: pred.subject,
    current_average: pred.current_average,
    predicted_mark: pred.predicted_mark,
    predicted_grade: pred.predicted_grade,
    confidence: pred.confidence,
    trend: pred.trend,
  }));
}
