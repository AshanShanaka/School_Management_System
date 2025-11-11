import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PERIODS, BLOCKED_TIMES, SCHOOL_DAYS } from "@/lib/schoolTimetableConfig";

// Define subject allocation weights for balanced distribution
const SUBJECT_PRIORITIES = {
  Mathematics: 5,
  Science: 5,
  English: 4,
  Sinhala: 4,
  ICT: 3,
  History: 3,
  Religion: 2,
  Buddhism: 2,
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classId = params.id;
    const body = await request.json();
    const { options = {} } = body;

    // Get class information
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: {
        grade: true,
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get all subjects with available teachers
    const subjects = await prisma.subject.findMany({
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Filter subjects that have teachers
    const availableSubjects = subjects.filter(
      (subject) => subject.teachers.length > 0
    );

    if (availableSubjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects with assigned teachers found" },
        { status: 400 }
      );
    }

    // Check if timetable already exists for this class
    let schoolTimetable = await prisma.schoolTimetable.findUnique({
      where: { classId: parseInt(classId) },
      include: { slots: true },
    });

    // Create or clear existing timetable
    if (schoolTimetable && !options.preserveExisting) {
      // Delete existing slots
      await prisma.timetableSlot.deleteMany({
        where: { timetableId: schoolTimetable.id },
      });
    } else if (!schoolTimetable) {
      // Create new timetable
      const currentYear = new Date().getFullYear();
      schoolTimetable = await prisma.schoolTimetable.create({
        data: {
          classId: parseInt(classId),
          academicYear: `${currentYear}/${currentYear + 1}`, // e.g., "2025/2026"
          term: "Term 1", // Default to Term 1
          isActive: true,
        },
        include: { slots: true },
      });
    }

    // Generate optimal timetable using AI-like algorithm
    const generatedSlots = [];
    const teacherSchedule: Record<string, Set<string>> = {}; // Track teacher availability

    // Calculate periods per subject based on priority
    const totalPeriods = SCHOOL_DAYS.length * 8; // 5 days × 8 periods = 40 total slots
    const blockedPeriods = 3; // Assembly + Interval + Pack-up (not full periods)
    const availableSlots = totalPeriods - blockedPeriods; // ~37 slots per week

    const subjectPeriods: Record<string, number> = {};
    let totalPriority = 0;

    availableSubjects.forEach((subject) => {
      const priority =
        SUBJECT_PRIORITIES[subject.name as keyof typeof SUBJECT_PRIORITIES] ||
        3;
      totalPriority += priority;
    });

    availableSubjects.forEach((subject) => {
      const priority =
        SUBJECT_PRIORITIES[subject.name as keyof typeof SUBJECT_PRIORITIES] ||
        3;
      subjectPeriods[subject.name] = Math.floor(
        (priority / totalPriority) * availableSlots
      );
    });

    // Distribute subjects across the week
    const slotAssignments: Array<{
      day: string;
      periodNumber: number;
      subjectId: number;
      teacherId: string;
    }> = [];

    for (const day of SCHOOL_DAYS) {
      for (let periodNumber = 1; periodNumber <= 8; periodNumber++) {
        const period = PERIODS.find((p) => p.period === periodNumber);
        if (!period) continue;

        // Check if this is a blocked time
        const isBlocked = BLOCKED_TIMES.some(
          (bt) =>
            bt.days.includes(day) &&
            period.startTime >= bt.startTime &&
            period.startTime < bt.endTime
        );

        if (isBlocked) continue;

        // Find a subject that still needs periods and has an available teacher
        let assigned = false;
        const shuffledSubjects = [...availableSubjects].sort(
          () => Math.random() - 0.5
        );

        // First pass: Try to assign subjects that still need periods
        for (const subject of shuffledSubjects) {
          if ((subjectPeriods[subject.name] || 0) <= 0) continue;

          // Find an available teacher for this subject
          const availableTeacher = subject.teachers.find((teacher) => {
            const teacherKey = `${day}-${periodNumber}-${teacher.id}`;
            return !teacherSchedule[teacherKey];
          });

          if (availableTeacher) {
            // Assign this slot
            slotAssignments.push({
              day,
              periodNumber,
              subjectId: subject.id,
              teacherId: availableTeacher.id,
            });

            // Mark teacher as busy
            const teacherKey = `${day}-${periodNumber}-${availableTeacher.id}`;
            if (!teacherSchedule[teacherKey]) {
              teacherSchedule[teacherKey] = new Set();
            }
            teacherSchedule[teacherKey].add(subject.name);

            // Decrease remaining periods for this subject
            subjectPeriods[subject.name]--;
            assigned = true;
            break;
          }
        }

        // Second pass: If slot is still empty, fill with any available subject/teacher
        if (!assigned) {
          for (const subject of shuffledSubjects) {
            // Find an available teacher for this subject
            const availableTeacher = subject.teachers.find((teacher) => {
              const teacherKey = `${day}-${periodNumber}-${teacher.id}`;
              return !teacherSchedule[teacherKey];
            });

            if (availableTeacher) {
              // Assign this slot
              slotAssignments.push({
                day,
                periodNumber,
                subjectId: subject.id,
                teacherId: availableTeacher.id,
              });

              // Mark teacher as busy
              const teacherKey = `${day}-${periodNumber}-${availableTeacher.id}`;
              if (!teacherSchedule[teacherKey]) {
                teacherSchedule[teacherKey] = new Set();
              }
              teacherSchedule[teacherKey].add(subject.name);

              assigned = true;
              break;
            }
          }
        }
      }
    }

    // Create timetable slots in database
    for (const assignment of slotAssignments) {
      const period = PERIODS.find((p) => p.period === assignment.periodNumber);
      if (!period) continue;

      try {
        await prisma.timetableSlot.create({
          data: {
            timetableId: schoolTimetable!.id,
            day: assignment.day,
            period: assignment.periodNumber,
            startTime: period.startTime,
            endTime: period.endTime,
            subjectId: assignment.subjectId,
            teacherId: assignment.teacherId,
            slotType: "REGULAR",
          },
        });

        generatedSlots.push(assignment);
      } catch (error) {
        console.error("Error creating slot:", error);
      }
    }

    // Fetch the complete timetable with relations
    const completeTimetable = await prisma.schoolTimetable.findUnique({
      where: { id: schoolTimetable!.id },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        slots: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: [{ day: "asc" }, { period: "asc" }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      timetable: completeTimetable,
      slots: completeTimetable?.slots || [],
      stats: {
        totalSlots: generatedSlots.length,
        subjectsScheduled: Object.keys(subjectPeriods).length,
        daysScheduled: SCHOOL_DAYS.length,
      },
      message: `Successfully generated timetable with ${generatedSlots.length} periods`,
    });
  } catch (error: any) {
    console.error("Error auto-generating timetable:", error);
    return NextResponse.json(
      {
        error: "Failed to auto-generate timetable",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
