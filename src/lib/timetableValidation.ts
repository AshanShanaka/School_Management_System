// Timetable Validation Service
import { PrismaClient } from "@prisma/client";
import { PERIODS, SCHOOL_DAYS, validateSlotTime } from "./schoolTimetableConfig";

const prisma = new PrismaClient();

export interface TimetableSlotInput {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subjectId?: number;
  teacherId?: string;
  slotType?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate a single timetable slot
export async function validateTimetableSlot(
  slot: TimetableSlotInput,
  classId: number,
  timetableId?: string,
  excludeSlotId?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check if day is valid
  if (!SCHOOL_DAYS.includes(slot.day as any)) {
    errors.push(`Invalid day: ${slot.day}. Must be Monday-Friday.`);
  }

  // 2. Check if period is valid (1-8)
  if (slot.period < 1 || slot.period > 8) {
    errors.push(`Invalid period: ${slot.period}. Must be between 1 and 8.`);
  }

  // 3. Check if time is not in blocked periods
  if (!validateSlotTime(slot.startTime, slot.endTime)) {
    errors.push(
      `Time slot ${slot.startTime}-${slot.endTime} is blocked (Assembly, Interval, or Pack-up time).`
    );
  }

  // 4. Check if this is a holiday
  const isHoliday = await checkHoliday(slot.day);
  if (isHoliday) {
    errors.push(`Cannot schedule on ${slot.day} - it's a holiday.`);
  }

  // 5. Check for class conflicts (only one subject per period per class)
  if (timetableId) {
    const classConflict = await prisma.timetableSlot.findFirst({
      where: {
        timetableId,
        day: slot.day as any,
        period: slot.period,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
      },
    });

    if (classConflict) {
      errors.push(
        `Class already has a subject scheduled for ${slot.day} Period ${slot.period}.`
      );
    }
  }

  // 6. Check for teacher conflicts (teacher cannot be in two places at once)
  if (slot.teacherId) {
    const teacherConflict = await prisma.timetableSlot.findFirst({
      where: {
        teacherId: slot.teacherId,
        day: slot.day as any,
        period: slot.period,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        timetable: {
          isActive: true,
          classId: { not: classId }, // Different class
        },
      },
      include: {
        timetable: {
          include: {
            class: true,
          },
        },
        subject: true,
      },
    });

    if (teacherConflict) {
      errors.push(
        `Teacher is already scheduled to teach ${teacherConflict.subject?.name} in ${teacherConflict.timetable.class.name} at ${slot.day} Period ${slot.period}.`
      );
    }
  }

  // 7. Validate time format
  if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) {
    errors.push("Invalid time format. Use HH:MM format (e.g., 07:40).");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate entire timetable
export async function validateCompleteTimetable(
  slots: TimetableSlotInput[],
  classId: number,
  timetableId?: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate each slot
  for (const slot of slots) {
    const result = await validateTimetableSlot(slot, classId, timetableId);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Check for duplicate slots in the input
  const slotKeys = new Set<string>();
  for (const slot of slots) {
    const key = `${slot.day}-${slot.period}`;
    if (slotKeys.has(key)) {
      errors.push(`Duplicate slot found: ${slot.day} Period ${slot.period}`);
    }
    slotKeys.add(key);
  }

  return {
    isValid: errors.length === 0,
    errors: Array.from(new Set(errors)), // Remove duplicates
    warnings: Array.from(new Set(warnings)),
  };
}

// Check if a date is a holiday
async function checkHoliday(day: string): Promise<boolean> {
  // This checks if the day name matches a holiday
  // You might want to check against specific dates instead
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: new Date(),
      },
    },
  });

  // For now, we'll just return false
  // In production, you'd check if the specific date is a holiday
  return false;
}

// Validate time format (HH:MM)
function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

// Check if double period is valid (consecutive periods, same subject and teacher)
export function validateDoublePeriod(
  slot1: TimetableSlotInput,
  slot2: TimetableSlotInput
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must be same day
  if (slot1.day !== slot2.day) {
    errors.push("Double period must be on the same day.");
  }

  // Must be consecutive periods
  if (Math.abs(slot1.period - slot2.period) !== 1) {
    errors.push("Double period must use consecutive period numbers.");
  }

  // Must have same subject
  if (slot1.subjectId !== slot2.subjectId) {
    errors.push("Double period must be for the same subject.");
  }

  // Must have same teacher
  if (slot1.teacherId !== slot2.teacherId) {
    errors.push("Double period must have the same teacher.");
  }

  // Cannot span across interval (period 4 to 5)
  const periods = [slot1.period, slot2.period].sort();
  if (periods[0] === 4 && periods[1] === 5) {
    errors.push("Double period cannot span across the interval (Period 4 to Period 5).");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Get teacher's schedule for a specific day and period
export async function getTeacherSchedule(
  teacherId: string,
  day: string,
  period: number
): Promise<{
  isAvailable: boolean;
  conflictingClass?: string;
  conflictingSubject?: string;
}> {
  const conflict = await prisma.timetableSlot.findFirst({
    where: {
      teacherId,
      day: day as any,
      period,
      timetable: {
        isActive: true,
      },
    },
    include: {
      timetable: {
        include: {
          class: true,
        },
      },
      subject: true,
    },
  });

  if (conflict) {
    return {
      isAvailable: false,
      conflictingClass: conflict.timetable.class.name,
      conflictingSubject: conflict.subject?.name,
    };
  }

  return {
    isAvailable: true,
  };
}

// Get all conflicts for a teacher across all timetables
export async function getTeacherConflicts(teacherId: string) {
  const slots = await prisma.timetableSlot.findMany({
    where: {
      teacherId,
      timetable: {
        isActive: true,
      },
    },
    include: {
      timetable: {
        include: {
          class: true,
        },
      },
      subject: true,
    },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });

  // Group by day and period to find conflicts
  const conflicts: any[] = [];
  const scheduleMap = new Map<string, any[]>();

  for (const slot of slots) {
    const key = `${slot.day}-${slot.period}`;
    if (!scheduleMap.has(key)) {
      scheduleMap.set(key, []);
    }
    scheduleMap.get(key)!.push(slot);
  }

  // Find conflicts (more than one class at same time)
  scheduleMap.forEach((slotList, key) => {
    if (slotList.length > 1) {
      conflicts.push({
        day: slotList[0].day,
        period: slotList[0].period,
        classes: slotList.map((s) => ({
          className: s.timetable.class.name,
          subject: s.subject?.name,
        })),
      });
    }
  });

  return conflicts;
}
