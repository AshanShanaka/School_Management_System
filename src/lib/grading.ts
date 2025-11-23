/**
 * Centralized Grading System
 * Simple Sri Lankan O/L Grading System: A, B, C, S, F
 */

export interface GradeInfo {
  grade: string;
  minPercent: number;
  maxPercent: number;
  description: string;
  color: string;
}

/**
 * Grade bands for Sri Lankan O/L system (Simple: A, B, C, S, F)
 */
export const GRADE_BANDS: GradeInfo[] = [
  { grade: "A", minPercent: 75, maxPercent: 100, description: "Excellent", color: "#10b981" }, // green
  { grade: "B", minPercent: 65, maxPercent: 74.99, description: "Very Good", color: "#eab308" }, // yellow
  { grade: "C", minPercent: 50, maxPercent: 64.99, description: "Credit", color: "#f97316" }, // orange
  { grade: "S", minPercent: 35, maxPercent: 49.99, description: "Simple Pass", color: "#ef4444" }, // red
  { grade: "F", minPercent: 0, maxPercent: 34.99, description: "Fail", color: "#991b1b" }, // dark red
];

/**
 * Calculate grade based on percentage
 * Simple system: A, B, C, S, F (no plus grades)
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 35) return "S";
  return "F";
}

/**
 * Get grade info including color and description
 */
export function getGradeInfo(grade: string): GradeInfo | undefined {
  return GRADE_BANDS.find(band => band.grade === grade);
}

/**
 * Get grade color
 */
export function getGradeColor(grade: string): string {
  const info = getGradeInfo(grade);
  return info?.color || "#6b7280"; // default gray
}

/**
 * Get grade description
 */
export function getGradeDescription(grade: string): string {
  const info = getGradeInfo(grade);
  return info?.description || "Unknown";
}

/**
 * Check if grade is passing
 */
export function isPassingGrade(grade: string): boolean {
  return ["A", "B", "C", "S"].includes(grade);
}

/**
 * Calculate grade from marks and max marks
 */
export function calculateGradeFromMarks(marks: number, maxMarks: number): string {
  if (maxMarks === 0) return "F";
  const percentage = (marks / maxMarks) * 100;
  return calculateGrade(percentage);
}

/**
 * Get numeric value for grade (for sorting)
 */
export function getGradeNumericValue(grade: string): number {
  const gradeMap: Record<string, number> = {
    "A": 5,
    "B": 4,
    "C": 3,
    "S": 2,
    "F": 1,
  };
  return gradeMap[grade] || 0;
}

/**
 * Format grade with color for display
 */
export function formatGradeWithColor(grade: string): { grade: string; color: string; bg: string } {
  const colorMap: Record<string, { text: string; bg: string }> = {
    "A": { text: "text-green-800", bg: "bg-green-100" },
    "B": { text: "text-yellow-700", bg: "bg-yellow-50" },
    "C": { text: "text-orange-700", bg: "bg-orange-50" },
    "S": { text: "text-red-700", bg: "bg-red-50" },
    "F": { text: "text-red-900", bg: "bg-red-100" },
  };

  const colors = colorMap[grade] || { text: "text-gray-700", bg: "bg-gray-50" };
  return { grade, color: colors.text, bg: colors.bg };
}

/**
 * Get all grade bands
 */
export function getAllGradeBands(): GradeInfo[] {
  return GRADE_BANDS;
}
