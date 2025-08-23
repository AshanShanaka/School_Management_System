// Modern School Timetable Configuration
// School operates from 8:30 AM to 1:30 PM with 8 periods and interval

export const SCHOOL_CONFIG = {
  // School timing
  startTime: "08:30",
  endTime: "13:30",

  // Period configuration
  totalPeriods: 8,
  intervalPeriod: 5, // After period 4

  // Timing details
  periodDuration: 45, // minutes
  intervalDuration: 20, // minutes

  // Working days
  workingDays: [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ] as const,
} as const;

export const PERIOD_TIMES = [
  { period: 1, startTime: "08:30", endTime: "09:15", isBreak: false },
  { period: 2, startTime: "09:15", endTime: "10:00", isBreak: false },
  { period: 3, startTime: "10:00", endTime: "10:45", isBreak: false },
  { period: 4, startTime: "10:45", endTime: "11:30", isBreak: false },
  { period: 5, startTime: "11:30", endTime: "11:50", isBreak: true }, // Interval
  { period: 6, startTime: "11:50", endTime: "12:35", isBreak: false },
  { period: 7, startTime: "12:35", endTime: "13:20", isBreak: false },
  { period: 8, startTime: "13:20", endTime: "14:05", isBreak: false }, // Extended if needed
] as const;

// Academic periods (excluding break)
export const ACADEMIC_PERIODS = PERIOD_TIMES.filter((p) => !p.isBreak);

// Color coding for subjects - Enhanced vibrant colors
export const SUBJECT_COLORS = {
  Mathematics: "#E74C3C", // Vibrant Red
  Science: "#27AE60", // Vibrant Green
  English: "#3498DB", // Vibrant Blue
  Sinhala: "#9B59B6", // Vibrant Purple
  History: "#F39C12", // Vibrant Orange
  Geography: "#1ABC9C", // Vibrant Teal
  Commerce: "#E67E22", // Vibrant Orange-Red
  Technology: "#2ECC71", // Vibrant Emerald
  Art: "#FF6B9D", // Vibrant Pink
  Religion: "#8E44AD", // Vibrant Violet
  "Physical Education": "#16A085", // Vibrant Sea Green
  Music: "#F1C40F", // Vibrant Yellow
  Dancing: "#E91E63", // Vibrant Pink-Red
  Drama: "#9C27B0", // Vibrant Deep Purple
  ICT: "#2196F3", // Vibrant Light Blue
  Biology: "#4CAF50", // Vibrant Nature Green
  Chemistry: "#FF9800", // Vibrant Amber
  Physics: "#795548", // Vibrant Brown
  Buddhism: "#673AB7", // Vibrant Deep Purple
  Tamil: "#607D8B", // Vibrant Blue Grey
  FREE: "#ECEFF1", // Light Grey for free periods
} as const;

// Priority subjects (core subjects that should appear more frequently)
export const PRIORITY_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Sinhala",
] as const;

// Constraints for auto-scheduling
export const SCHEDULING_CONSTRAINTS = {
  // Maximum periods per subject per week - Updated to be more flexible
  maxPeriodsPerSubject: {
    Mathematics: 8,
    Science: 10, // Increased from 5 to 10
    English: 8, // Increased from 4 to 8
    Sinhala: 8, // Increased from 4 to 8
    History: 6, // Increased from 3 to 6
    Geography: 5,
    Religion: 4,
    Buddhism: 6, // Increased from 3 to 6
    Commerce: 5,
    Technology: 4,
    Art: 4,
    "Physical Education": 4,
    Music: 3,
    Dancing: 3,
    Drama: 3,
    ICT: 5,
    Biology: 6,
    Chemistry: 6,
    Physics: 6,
    Tamil: 5,
    default: 6, // Increased default from 3 to 6
  },

  // Minimum periods per subject per week
  minPeriodsPerSubject: {
    Mathematics: 3,
    Science: 3,
    English: 3,
    Sinhala: 3,
    Buddhism: 1,
    Religion: 1,
    default: 1,
  },

  // Preferred time slots for subjects
  preferredSlots: {
    Mathematics: [1, 2, 6, 7], // Morning periods preferred
    Science: [2, 3, 6, 7],
    English: [1, 3, 6, 8],
    "Physical Education": [7, 8], // Afternoon preferred
    Art: [6, 7, 8],
    Music: [6, 7, 8],
  },

  // Subjects that shouldn't be consecutive
  avoidConsecutive: [
    ["Mathematics", "Science"], // Avoid heavy subjects back-to-back
    ["Physical Education", "Mathematics"],
  ],
} as const;

// Days configuration
export type DayType = (typeof SCHOOL_CONFIG.workingDays)[number];

export const DAYS_CONFIG = {
  MONDAY: { name: "Monday", shortName: "Mon" },
  TUESDAY: { name: "Tuesday", shortName: "Tue" },
  WEDNESDAY: { name: "Wednesday", shortName: "Wed" },
  THURSDAY: { name: "Thursday", shortName: "Thu" },
  FRIDAY: { name: "Friday", shortName: "Fri" },
} as const;

// Special day types
export const SPECIAL_DAY_TYPES = {
  POYA_DAY: { name: "Poya Day", color: "#FFE4B5" },
  PUBLIC_HOLIDAY: { name: "Public Holiday", color: "#FFB6C1" },
  SCHOOL_EVENT: { name: "School Event", color: "#E6E6FA" },
  EXAMINATION: { name: "Examination", color: "#FFA07A" },
  VACATION: { name: "Vacation", color: "#98FB98" },
  SPORTS_DAY: { name: "Sports Day", color: "#87CEEB" },
  CULTURAL_EVENT: { name: "Cultural Event", color: "#DDA0DD" },
} as const;

// Export utility functions
export const getTimetableSlotId = (day: DayType, period: number): string =>
  `${day}_${period}`;

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":");
  const hour24 = parseInt(hours);
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${ampm}`;
};

export const getSubjectColor = (subjectName: string): string =>
  SUBJECT_COLORS[subjectName as keyof typeof SUBJECT_COLORS] || "#E0E0E0";

export const isPrioritySubject = (subjectName: string): boolean =>
  PRIORITY_SUBJECTS.includes(subjectName as any);

// Conflict detection utilities
export type ConflictType =
  | "TEACHER_DOUBLE_BOOKING"
  | "SUBJECT_OVERLAP"
  | "TEACHER_UNAVAILABLE";

export interface TimetableConflict {
  type: ConflictType;
  message: string;
  severity: "low" | "medium" | "high";
  day: DayType;
  period: number;
  affectedClasses?: string[];
  affectedTeacher?: string;
  subject?: string;
}
