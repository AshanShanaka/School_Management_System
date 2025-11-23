// O/L Grade types
export type OLGrade = 'A' | 'B' | 'C' | 'S' | 'W';

// Risk status types
export type RiskStatus = 'On Track' | 'Needs Attention' | 'At Risk';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Attendance band types
export type AttendanceBand = 'Excellent' | 'Good' | 'Weak' | 'Critical';

// Subject prediction with grades
export interface SubjectPrediction {
  subject: string;
  current_average: number;
  predicted_mark: number;
  predicted_grade: OLGrade;
  confidence: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

// Complete performance insight for a student
export interface PerformanceInsight {
  studentId: string;
  name: string;
  className: string;
  attendancePercentage: number;
  attendanceBand: AttendanceBand;
  predictedGrades: Record<string, OLGrade>;
  overallPredictedLevel: string;
  riskStatus: RiskStatus;
  riskLevel: RiskLevel;
  mainFactors: string[];
  weakSubjects: SubjectPrediction[];
  strongSubjects: SubjectPrediction[];
  suggestions: string[];
  subjectPredictions: SubjectPrediction[];
  probabilityPassAll: number;
}

// Simplified insight for class view
export interface ClassStudentInsight {
  studentId: string;
  name: string;
  attendancePercentage: number;
  attendanceBand: AttendanceBand;
  overallPredictedLevel: string;
  riskStatus: RiskStatus;
  riskLevel: RiskLevel;
  mainFactors: string[];
}

// ML API Response types
export interface MLPredictionResponse {
  predictedGrades: Record<string, OLGrade>;
  overallRisk: RiskLevel;
  probabilityPassAll: number;
  mainFactors: string[];
  subjectPredictions: {
    subject: string;
    predictedMark: number;
    predictedGrade: OLGrade;
    currentAverage: number;
  }[];
  attendanceRate: number;
  adjustmentFactor: number;
}

// Input for ML API
export interface MLPredictionInput {
  subjects: {
    name: string;
    marks: number[];
  }[];
  attendance: number;
}

