export const TIMETABLE_CONFIG = {
  startTime: "08:30",
  endTime: "13:30",
  periodDuration: 50, // 50 minutes per period
  breakPeriod: 6, // 6th period is break time
  breakDuration: 20, // 20 minutes break
  days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const,

  timeSlots: [
    { period: 1, startTime: "08:30", endTime: "09:20", isBreak: false },
    { period: 2, startTime: "09:20", endTime: "10:10", isBreak: false },
    { period: 3, startTime: "10:10", endTime: "10:50", isBreak: false }, // Shorter period before break
    { period: 4, startTime: "10:50", endTime: "11:10", isBreak: true }, // 20-minute break
    { period: 5, startTime: "11:10", endTime: "12:00", isBreak: false },
    { period: 6, startTime: "12:00", endTime: "12:50", isBreak: false },
    { period: 7, startTime: "12:50", endTime: "13:30", isBreak: false }, // Shorter last period
  ],
} as const;
