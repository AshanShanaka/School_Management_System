// School Timetable Configuration
// Based on the school rules provided

export const SCHOOL_HOURS = {
  // Assembly (not schedulable)
  ASSEMBLY_START: "07:30",
  ASSEMBLY_END: "07:40",
  
  // School periods
  SCHOOL_START: "07:40",
  SCHOOL_END: "13:30",
  
  // Interval (blocked)
  INTERVAL_START: "10:20",
  INTERVAL_END: "10:40",
  
  // Pack-up (not schedulable)
  PACKUP_START: "13:20",
  PACKUP_END: "13:30",
} as const;

export const PERIOD_DURATION = 40; // minutes

export const SCHOOL_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

// 8 periods with specific times
export const PERIODS = [
  {
    period: 1,
    startTime: "07:40",
    endTime: "08:20",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
  {
    period: 2,
    startTime: "08:20",
    endTime: "09:00",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
  {
    period: 3,
    startTime: "09:00",
    endTime: "09:40",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
  {
    period: 4,
    startTime: "09:40",
    endTime: "10:20",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
  // Interval 10:20 - 10:40
  {
    period: 5,
    startTime: "10:40",
    endTime: "11:20",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
  {
    period: 6,
    startTime: "11:20",
    endTime: "12:00",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
  {
    period: 7,
    startTime: "12:00",
    endTime: "12:40",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
  {
    period: 8,
    startTime: "12:40",
    endTime: "13:20",
    isBreak: false,
    slotType: "REGULAR" as const,
  },
] as const;

// Blocked times (cannot be scheduled)
export const BLOCKED_TIMES = [
  {
    name: "Assembly",
    startTime: "07:30",
    endTime: "07:40",
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    description: "Morning assembly - not schedulable",
  },
  {
    name: "Interval",
    startTime: "10:20",
    endTime: "10:40",
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    description: "Break time - blocked",
  },
  {
    name: "Pack-up",
    startTime: "13:20",
    endTime: "13:30",
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    description: "Pack-up time - not schedulable",
  },
] as const;

// Default subjects (can be customized)
export const DEFAULT_SUBJECTS = [
  { name: "Buddhism", code: "BUD" },
  { name: "English", code: "ENG" },
  { name: "History", code: "HIS" },
  { name: "Mathematics", code: "MATH" },
  { name: "Religion", code: "REL" },
  { name: "Science", code: "SCI" },
  { name: "Sinhala", code: "SIN" },
  { name: "ICT", code: "ICT" },
] as const;

// Color codes for subjects (for UI)
export const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-100 text-blue-800 border-blue-300",
  Science: "bg-green-100 text-green-800 border-green-300",
  English: "bg-purple-100 text-purple-800 border-purple-300",
  Sinhala: "bg-orange-100 text-orange-800 border-orange-300",
  History: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Buddhism: "bg-pink-100 text-pink-800 border-pink-300",
  Religion: "bg-indigo-100 text-indigo-800 border-indigo-300",
  ICT: "bg-cyan-100 text-cyan-800 border-cyan-300",
  DEFAULT: "bg-gray-100 text-gray-800 border-gray-300",
};

// Get time range display
export function getTimeDisplay(period: number): string {
  const periodData = PERIODS.find(p => p.period === period);
  if (!periodData) return "";
  return `${periodData.startTime} - ${periodData.endTime}`;
}

// Get subject color
export function getSubjectColor(subjectName: string): string {
  return SUBJECT_COLORS[subjectName] || SUBJECT_COLORS.DEFAULT;
}

// Check if a time falls within interval
export function isIntervalTime(startTime: string, endTime: string): boolean {
  return startTime === SCHOOL_HOURS.INTERVAL_START && endTime === SCHOOL_HOURS.INTERVAL_END;
}

// Check if a period is schedulable
export function isSchedulablePeriod(period: number): boolean {
  return period >= 1 && period <= 8;
}

// Validate timetable slot time
export function validateSlotTime(startTime: string, endTime: string): boolean {
  // Check if time falls in blocked periods
  for (const blocked of BLOCKED_TIMES) {
    if (startTime === blocked.startTime && endTime === blocked.endTime) {
      return false;
    }
  }
  return true;
}
