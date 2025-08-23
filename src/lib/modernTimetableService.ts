// Modern Timetable Service with Auto-Scheduling and Conflict Detection

import {
  SCHOOL_CONFIG,
  PERIOD_TIMES,
  ACADEMIC_PERIODS,
  SCHEDULING_CONSTRAINTS,
  DayType,
  TimetableConflict,
  ConflictType,
  getTimetableSlotId,
} from "./modernTimetableConfig";
import prisma from "./prisma";

export interface TimetableSlotData {
  id?: number;
  day: DayType;
  period: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  subjectId?: number;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  classId: number;
  className: string;
}

export interface ClassTimetableData {
  classId: number;
  className: string;
  gradeLevel: number;
  slots: TimetableSlotData[];
  subjects: SubjectAssignment[];
  conflicts: TimetableConflict[];
}

export interface SubjectAssignment {
  subjectId: number;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  periodsPerWeek: number;
  priority: "high" | "medium" | "low";
}

export class ModernTimetableService {
  /**
   * Get complete timetable for a class with conflict detection
   */
  async getClassTimetable(classId: number): Promise<ClassTimetableData> {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        grade: true,
        timetables: {
          include: {
            slots: {
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        subjectAssignments: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    // Get the active timetable slots
    const timetableSlots = classData.timetables[0]?.slots || [];

    // Generate all time slots
    const allSlots: TimetableSlotData[] = [];
    for (const day of SCHOOL_CONFIG.workingDays) {
      for (const periodConfig of PERIOD_TIMES) {
        const existingSlot = timetableSlots.find(
          (slot: any) => slot.day === day && slot.period === periodConfig.period
        );

        allSlots.push({
          id: existingSlot?.id,
          day,
          period: periodConfig.period,
          startTime: periodConfig.startTime,
          endTime: periodConfig.endTime,
          isBreak: periodConfig.isBreak,
          subjectId: existingSlot?.subjectId || undefined,
          subjectName: existingSlot?.subject?.name,
          teacherId: existingSlot?.teacherId || undefined,
          teacherName: existingSlot?.teacher
            ? `${existingSlot.teacher.name} ${existingSlot.teacher.surname}`
            : undefined,
          classId,
          className: classData.name,
        });
      }
    }

    // Prepare subject assignments
    const subjects: SubjectAssignment[] = classData.subjectAssignments.map(
      (assignment: any) => ({
        subjectId: assignment.subjectId,
        subjectName: assignment.subject.name,
        teacherId: assignment.teacherId,
        teacherName: `${assignment.teacher.name} ${assignment.teacher.surname}`,
        periodsPerWeek: this.calculateCurrentPeriodsPerWeek(
          assignment.subjectId,
          allSlots
        ),
        priority: this.getSubjectPriority(assignment.subject.name),
      })
    );

    // Detect conflicts
    const conflicts = await this.detectConflicts(allSlots);

    return {
      classId,
      className: classData.name,
      gradeLevel: classData.grade.level,
      slots: allSlots,
      subjects,
      conflicts,
    };
  }

  /**
   * Auto-schedule timetable for a class
   */
  async autoScheduleTimetable(
    classId: number,
    options?: {
      preserveExisting?: boolean;
      balanceSubjects?: boolean;
      respectTeacherPreferences?: boolean;
    }
  ): Promise<ClassTimetableData> {
    const { preserveExisting = false, balanceSubjects = true } = options || {};

    // Get class data and subject assignments
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        grade: true,
        subjectAssignments: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    // Get existing timetable if preserving
    let existingSlots: TimetableSlotData[] = [];
    if (preserveExisting) {
      const existing = await this.getClassTimetable(classId);
      existingSlots = existing.slots.filter((slot) => slot.subjectId);
    }

    // Clear existing timetable if not preserving
    if (!preserveExisting) {
      await prisma.timetableSlot.deleteMany({
        where: {
          timetable: { classId },
        },
      });
    }

    // Ensure timetable exists
    let timetable = await prisma.timetable.findFirst({
      where: { classId },
    });

    if (!timetable) {
      timetable = await prisma.timetable.create({
        data: {
          name: `Timetable for ${classData.name}`,
          academicYear: new Date().getFullYear().toString(),
          classId,
          isActive: true,
        },
      });
    }

    // Generate schedule
    const schedule = await this.generateOptimalSchedule(
      classData.subjectAssignments,
      existingSlots,
      { balanceSubjects }
    );

    // Save new slots
    for (const slot of schedule) {
      if (!slot.isBreak && slot.subjectId && slot.teacherId) {
        await prisma.timetableSlot.upsert({
          where: {
            timetableId_day_period: {
              timetableId: timetable.id,
              day: slot.day,
              period: slot.period,
            },
          },
          update: {
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
          },
          create: {
            timetableId: timetable.id,
            day: slot.day,
            period: slot.period,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBreak: slot.isBreak,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
          },
        });
      }
    }

    return this.getClassTimetable(classId);
  }

  /**
   * Generate optimal schedule using constraint-based algorithm
   */
  private async generateOptimalSchedule(
    subjectAssignments: any[],
    existingSlots: TimetableSlotData[],
    options: { balanceSubjects?: boolean }
  ): Promise<TimetableSlotData[]> {
    const schedule: TimetableSlotData[] = [];

    // Initialize all slots
    for (const day of SCHOOL_CONFIG.workingDays) {
      for (const periodConfig of PERIOD_TIMES) {
        const existing = existingSlots.find(
          (slot) => slot.day === day && slot.period === periodConfig.period
        );

        schedule.push({
          day,
          period: periodConfig.period,
          startTime: periodConfig.startTime,
          endTime: periodConfig.endTime,
          isBreak: periodConfig.isBreak,
          subjectId: existing?.subjectId,
          teacherId: existing?.teacherId,
          classId: existing?.classId || 0,
          className: existing?.className || "",
        });
      }
    }

    // Calculate periods needed for each subject
    const subjectRequirements = subjectAssignments.map((assignment: any) => {
      const subjectName = assignment.subject.name;
      const maxPeriods =
        (SCHEDULING_CONSTRAINTS.maxPeriodsPerSubject as any)[subjectName] ||
        SCHEDULING_CONSTRAINTS.maxPeriodsPerSubject.default;
      const minPeriods =
        (SCHEDULING_CONSTRAINTS.minPeriodsPerSubject as any)[subjectName] ||
        SCHEDULING_CONSTRAINTS.minPeriodsPerSubject.default;

      return {
        ...assignment,
        targetPeriods: Math.min(maxPeriods, Math.max(minPeriods, 3)),
        assignedPeriods: 0,
        priority: this.getSubjectPriority(subjectName),
      };
    });

    // Sort by priority
    subjectRequirements.sort((a: any, b: any) => {
      const priorityOrder: any = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Assign periods using constraint satisfaction
    for (const requirement of subjectRequirements) {
      const preferredSlots = (SCHEDULING_CONSTRAINTS.preferredSlots as any)[
        requirement.subject.name
      ] || [1, 2, 3, 4, 6, 7, 8];

      let assigned = 0;
      const targetPeriods = requirement.targetPeriods;

      for (const day of SCHOOL_CONFIG.workingDays) {
        if (assigned >= targetPeriods) break;

        for (const period of preferredSlots) {
          if (assigned >= targetPeriods) break;

          const slotIndex = schedule.findIndex(
            (slot) =>
              slot.day === day && slot.period === period && !slot.isBreak
          );

          if (slotIndex >= 0 && !schedule[slotIndex].subjectId) {
            // Check conflicts
            const hasConflict = await this.checkSlotConflict(
              requirement.teacherId,
              day,
              period,
              requirement.subject.id
            );

            if (!hasConflict) {
              schedule[slotIndex].subjectId = requirement.subject.id;
              schedule[slotIndex].teacherId = requirement.teacherId;
              assigned++;
            }
          }
        }
      }
    }

    return schedule;
  }

  /**
   * Detect conflicts in timetable
   */
  async detectConflicts(
    slots: TimetableSlotData[]
  ): Promise<TimetableConflict[]> {
    const conflicts: TimetableConflict[] = [];

    // Check for teacher double-booking
    const teacherSlots = new Map<string, Set<string>>();

    for (const slot of slots) {
      if (slot.teacherId && !slot.isBreak) {
        const slotKey = getTimetableSlotId(slot.day, slot.period);

        if (!teacherSlots.has(slot.teacherId)) {
          teacherSlots.set(slot.teacherId, new Set());
        }

        const teacherSlotSet = teacherSlots.get(slot.teacherId)!;

        if (teacherSlotSet.has(slotKey)) {
          conflicts.push({
            type: "TEACHER_DOUBLE_BOOKING",
            message: `${slot.teacherName} is assigned to multiple classes at the same time`,
            severity: "high",
            day: slot.day,
            period: slot.period,
            affectedTeacher: slot.teacherName,
          });
        } else {
          teacherSlotSet.add(slotKey);
        }
      }
    }

    // Check for subject distribution issues - More lenient approach
    const subjectCounts = new Map<number, number>();
    for (const slot of slots) {
      if (slot.subjectId && !slot.isBreak) {
        subjectCounts.set(
          slot.subjectId,
          (subjectCounts.get(slot.subjectId) || 0) + 1
        );
      }
    }

    // Convert map to array for iteration - Only warn if SIGNIFICANTLY over limit
    const subjectCountsArray = Array.from(subjectCounts.entries());
    for (const [subjectId, count] of subjectCountsArray) {
      const slot = slots.find((s) => s.subjectId === subjectId);
      if (slot?.subjectName) {
        const maxAllowed =
          (SCHEDULING_CONSTRAINTS.maxPeriodsPerSubject as any)[
            slot.subjectName
          ] || SCHEDULING_CONSTRAINTS.maxPeriodsPerSubject.default;

        // Only create conflict if significantly over the limit (more than 50% over)
        const threshold = Math.floor(maxAllowed * 1.5);
        if (count > threshold) {
          conflicts.push({
            type: "SUBJECT_OVERLAP",
            message: `${slot.subjectName} has significantly too many periods (${count} > ${maxAllowed} recommended)`,
            severity: "medium",
            day: slot.day,
            period: slot.period,
            subject: slot.subjectName,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if a specific slot has conflicts
   */
  private async checkSlotConflict(
    teacherId: string,
    day: DayType,
    period: number,
    subjectId: number
  ): Promise<boolean> {
    // Check if teacher is already assigned to another class at this time
    const existingAssignment = await prisma.timetableSlot.findFirst({
      where: {
        teacherId,
        day,
        period,
        NOT: { timetable: { classId: undefined } },
      },
    });

    return !!existingAssignment;
  }

  /**
   * Get teacher availability for auto-scheduling
   */
  async getTeacherAvailability(teacherId: string): Promise<
    {
      day: DayType;
      period: number;
      available: boolean;
    }[]
  > {
    const assignments = await prisma.timetableSlot.findMany({
      where: { teacherId },
      select: { day: true, period: true },
    });

    const availability = [];
    for (const day of SCHOOL_CONFIG.workingDays) {
      for (const periodConfig of ACADEMIC_PERIODS) {
        const isAssigned = assignments.some(
          (assignment) =>
            assignment.day === day && assignment.period === periodConfig.period
        );

        availability.push({
          day,
          period: periodConfig.period,
          available: !isAssigned,
        });
      }
    }

    return availability;
  }

  /**
   * Export timetable data for PDF/Excel generation
   */
  async exportTimetableData(classId: number): Promise<{
    className: string;
    gradeLevel: number;
    periods: any[][];
    metadata: any;
  }> {
    const timetableData = await this.getClassTimetable(classId);

    // Organize data in a grid format
    const grid: any[][] = [];

    // Header row
    const headerRow = [
      "Period/Day",
      ...SCHOOL_CONFIG.workingDays.map(
        (day) => day.charAt(0) + day.slice(1).toLowerCase()
      ),
    ];
    grid.push(headerRow);

    // Data rows
    for (const periodConfig of PERIOD_TIMES) {
      const row = [
        periodConfig.isBreak
          ? `Break (${periodConfig.startTime}-${periodConfig.endTime})`
          : `Period ${periodConfig.period} (${periodConfig.startTime}-${periodConfig.endTime})`,
      ];

      for (const day of SCHOOL_CONFIG.workingDays) {
        const slot = timetableData.slots.find(
          (s) => s.day === day && s.period === periodConfig.period
        );

        if (slot?.isBreak) {
          row.push("BREAK");
        } else if (slot?.subjectName) {
          row.push(`${slot.subjectName}\n${slot.teacherName}`);
        } else {
          row.push("Free Period");
        }
      }

      grid.push(row);
    }

    return {
      className: timetableData.className,
      gradeLevel: timetableData.gradeLevel,
      periods: grid,
      metadata: {
        generated: new Date().toISOString(),
        academicYear: new Date().getFullYear(),
        totalSubjects: timetableData.subjects.length,
        conflicts: timetableData.conflicts.length,
      },
    };
  }

  // Helper methods
  private calculateCurrentPeriodsPerWeek(
    subjectId: number,
    slots: TimetableSlotData[]
  ): number {
    return slots.filter((slot) => slot.subjectId === subjectId && !slot.isBreak)
      .length;
  }

  private getSubjectPriority(subjectName: string): "high" | "medium" | "low" {
    if (
      ["Mathematics", "Science", "English", "Sinhala"].includes(subjectName)
    ) {
      return "high";
    }
    if (["History", "Geography", "Commerce", "ICT"].includes(subjectName)) {
      return "medium";
    }
    return "low";
  }
}

export const timetableService = new ModernTimetableService();
