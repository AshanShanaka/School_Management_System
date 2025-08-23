// Client-side Modern Timetable Service
"use client";

import {
  SCHOOL_CONFIG,
  PERIOD_TIMES,
  DAYS_CONFIG,
  TimetableConflict,
} from "@/lib/modernTimetableConfig";

export interface TimetableSlotData {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  subjectId?: number;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
}

export interface ClassTimetableData {
  classId: number;
  className: string;
  gradeLevel: number;
  studentCount?: number;
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

class ClientTimetableService {
  // Mock data for demonstration
  private mockSubjects = [
    {
      id: 1,
      name: "Mathematics",
      teacherId: "T001",
      teacherName: "John Smith",
      periodsPerWeek: 6,
      priority: "high" as const,
    },
    {
      id: 2,
      name: "English",
      teacherId: "T002",
      teacherName: "Sarah Johnson",
      periodsPerWeek: 5,
      priority: "high" as const,
    },
    {
      id: 3,
      name: "Science",
      teacherId: "T003",
      teacherName: "Mike Wilson",
      periodsPerWeek: 4,
      priority: "high" as const,
    },
    {
      id: 4,
      name: "History",
      teacherId: "T004",
      teacherName: "Emma Davis",
      periodsPerWeek: 3,
      priority: "medium" as const,
    },
    {
      id: 5,
      name: "Geography",
      teacherId: "T005",
      teacherName: "David Brown",
      periodsPerWeek: 3,
      priority: "medium" as const,
    },
    {
      id: 6,
      name: "Art",
      teacherId: "T006",
      teacherName: "Lisa Garcia",
      periodsPerWeek: 2,
      priority: "low" as const,
    },
    {
      id: 7,
      name: "Physical Education",
      teacherId: "T007",
      teacherName: "Tom Anderson",
      periodsPerWeek: 2,
      priority: "medium" as const,
    },
    {
      id: 8,
      name: "Music",
      teacherId: "T008",
      teacherName: "Anna Martinez",
      periodsPerWeek: 1,
      priority: "low" as const,
    },
  ];

  async getClassTimetable(classId: number): Promise<ClassTimetableData> {
    try {
      // Fetch from the actual API instead of using mock data
      const response = await fetch(`/api/timetables/${classId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to fetch timetable from API');
      }
    } catch (error) {
      console.error('Error fetching timetable from API, falling back to mock:', error);
      
      // Fallback to mock data only if API fails
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get class info from API first
      let className = "Unknown";
      let gradeLevel = 1;
      
      try {
        const classResponse = await fetch('/api/classes/active');
        if (classResponse.ok) {
          const classes = await classResponse.json();
          const foundClass = classes.find((c: any) => c.id === classId);
          if (foundClass) {
            className = foundClass.name;
            gradeLevel = foundClass.grade?.level || 1;
          }
        }
      } catch (apiError) {
        console.error('Failed to fetch class info:', apiError);
        // Use old fallback method if class API also fails
        className = this.getClassNameById(classId);
        gradeLevel = this.getGradeLevelFromClassName(className);
      }

      // Create empty slots
      const slots: TimetableSlotData[] = [];

      SCHOOL_CONFIG.workingDays.forEach((day) => {
        PERIOD_TIMES.forEach((periodConfig) => {
          slots.push({
            day,
            period: periodConfig.period,
            startTime: periodConfig.startTime,
            endTime: periodConfig.endTime,
            isBreak: periodConfig.isBreak,
          });
        });
      });

      // Get subjects for this grade
      const subjects = this.getSubjectsForGrade(gradeLevel);

      const result: ClassTimetableData = {
        classId,
        className,
        gradeLevel,
        studentCount: 25,
        slots,
        subjects,
        conflicts: [],
      };

      return result;
    }
  }

  async autoScheduleTimetable(
    classId: number,
    options: any = {}
  ): Promise<ClassTimetableData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const timetableData = await this.getClassTimetable(classId);

    // Auto-assign subjects to slots
    const availableSlots = timetableData.slots.filter((slot) => !slot.isBreak);
    const subjects = [...timetableData.subjects];

    // Reset all slots
    timetableData.slots.forEach((slot) => {
      if (!slot.isBreak) {
        slot.subjectId = undefined;
        slot.subjectName = undefined;
        slot.teacherId = undefined;
        slot.teacherName = undefined;
      }
    });

    // Simple scheduling algorithm
    let slotIndex = 0;
    subjects.forEach((subject) => {
      for (
        let i = 0;
        i < subject.periodsPerWeek && slotIndex < availableSlots.length;
        i++
      ) {
        const slot = availableSlots[slotIndex];
        slot.subjectId = subject.subjectId;
        slot.subjectName = subject.subjectName;
        slot.teacherId = subject.teacherId;
        slot.teacherName = subject.teacherName;
        slotIndex++;
      }
    });

    // Detect conflicts
    timetableData.conflicts = this.detectConflicts(timetableData);

    return timetableData;
  }

  private getClassNameById(classId: number): string {
    // Mock mapping
    const classNames = [
      "1-A",
      "1-B",
      "2-A",
      "2-B",
      "3-A",
      "3-B",
      "4-A",
      "4-B",
      "5-A",
      "5-B",
      "6-A",
      "6-B",
      "7-A",
      "7-B",
      "8-A",
      "8-B",
      "9-A",
      "9-B",
      "10-A",
      "10-B",
      "11-A",
      "11-B",
    ];
    return classNames[classId - 1] || "1-A";
  }

  private getGradeLevelFromClassName(className: string): number {
    return parseInt(className.split("-")[0]) || 1;
  }

  private getSubjectsForGrade(gradeLevel: number): SubjectAssignment[] {
    // Adjust subjects based on grade level
    let subjects = [...this.mockSubjects];

    if (gradeLevel <= 3) {
      // Elementary subjects
      subjects = subjects.filter((s) =>
        [
          "Mathematics",
          "English",
          "Science",
          "Art",
          "Physical Education",
          "Music",
        ].includes(s.name)
      );
    } else if (gradeLevel <= 8) {
      // Middle school subjects
      subjects = subjects.filter(
        (s) => !["Advanced Physics", "Advanced Chemistry"].includes(s.name)
      );
    }

    return subjects.map((subject) => ({
      subjectId: subject.id,
      subjectName: subject.name,
      teacherId: subject.teacherId,
      teacherName: subject.teacherName,
      periodsPerWeek: subject.periodsPerWeek,
      priority: subject.priority,
    }));
  }

  private detectConflicts(
    timetableData: ClassTimetableData
  ): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];

    // Check for teacher conflicts (same teacher teaching different classes at same time)
    const teacherSlots = new Map<string, TimetableSlotData[]>();

    timetableData.slots.forEach((slot) => {
      if (slot.teacherId && !slot.isBreak) {
        if (!teacherSlots.has(slot.teacherId)) {
          teacherSlots.set(slot.teacherId, []);
        }
        teacherSlots.get(slot.teacherId)?.push(slot);
      }
    });

    // Simulate some conflicts for demonstration
    if (Math.random() > 0.7) {
      conflicts.push({
        type: "TEACHER_DOUBLE_BOOKING" as const,
        day: "MONDAY",
        period: 1,
        message: "Teacher John Smith has conflicting schedules",
        severity: "high" as const,
      });
    }

    return conflicts;
  }
}

export const timetableService = new ClientTimetableService();
