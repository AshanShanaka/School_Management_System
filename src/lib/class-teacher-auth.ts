import prisma from "@/lib/prisma";

/**
 * Class Teacher Authentication and Authorization Utilities
 * These functions help verify class teacher permissions and retrieve their assigned class
 */

/**
 * Check if a teacher is assigned as a class teacher
 * @param teacherId - The ID of the teacher to check
 * @returns boolean indicating if the teacher is a class teacher
 */
export async function isClassTeacher(teacherId: string): Promise<boolean> {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { assignedClassId: true },
    });

    return !!teacher?.assignedClassId;
  } catch (error) {
    console.error("Error checking class teacher status:", error);
    return false;
  }
}

/**
 * Get the class assigned to a teacher
 * @param teacherId - The ID of the teacher
 * @returns The assigned class with grade info, or null if not assigned
 */
export async function getAssignedClass(teacherId: string) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        assignedClassId: true,
        assignedClass: {
          include: {
            grade: {
              select: {
                id: true,
                level: true,
              },
            },
          },
        },
      },
    });

    return teacher?.assignedClass || null;
  } catch (error) {
    console.error("Error fetching assigned class:", error);
    return null;
  }
}

/**
 * Check if a teacher has permission to access a specific class as class teacher
 * @param teacherId - The ID of the teacher
 * @param classId - The ID of the class to check access for
 * @returns boolean indicating if the teacher can access this class
 */
export async function hasClassTeacherPermission(
  teacherId: string,
  classId: number
): Promise<boolean> {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { assignedClassId: true },
    });

    return teacher?.assignedClassId === classId;
  } catch (error) {
    console.error("Error checking class teacher permission:", error);
    return false;
  }
}

/**
 * Get students in the class teacher's assigned class
 * @param teacherId - The ID of the class teacher
 * @returns Array of students with parent information
 */
export async function getClassStudents(teacherId: string) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { assignedClassId: true },
    });

    if (!teacher?.assignedClassId) {
      return [];
    }

    const students = await prisma.student.findMany({
      where: {
        classId: teacher.assignedClassId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return students;
  } catch (error) {
    console.error("Error fetching class students:", error);
    return [];
  }
}

/**
 * Get parents of students in the class teacher's assigned class
 * @param teacherId - The ID of the class teacher
 * @returns Array of unique parents
 */
export async function getClassParents(teacherId: string) {
  try {
    const students = await getClassStudents(teacherId);
    
    // Get unique parents (in case of siblings in same class)
    const parentsMap = new Map();
    students.forEach(student => {
      if (!parentsMap.has(student.parent.id)) {
        parentsMap.set(student.parent.id, {
          ...student.parent,
          fullName: `${student.parent.name} ${student.parent.surname}`,
        });
      }
    });

    return Array.from(parentsMap.values());
  } catch (error) {
    console.error("Error fetching class parents:", error);
    return [];
  }
}

/**
 * Verify that a teacher is a class teacher and return their info
 * Throws error if not a class teacher
 * @param teacherId - The ID of the teacher
 * @returns Teacher info with assigned class
 */
export async function requireClassTeacher(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      phone: true,
      assignedClassId: true,
      assignedClass: {
        include: {
          grade: {
            select: {
              id: true,
              level: true,
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  if (!teacher.assignedClassId || !teacher.assignedClass) {
    throw new Error("You are not assigned as a class teacher");
  }

  return teacher;
}

/**
 * Get the active class teacher assignment record for a teacher
 * @param teacherId - The ID of the teacher
 * @returns Active assignment record or null
 */
export async function getActiveAssignment(teacherId: string) {
  try {
    const assignment = await prisma.classTeacherAssignment.findFirst({
      where: {
        teacherId: teacherId,
        isActive: true,
      },
      include: {
        class: {
          include: {
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
      },
    });

    return assignment;
  } catch (error) {
    console.error("Error fetching active assignment:", error);
    return null;
  }
}

/**
 * Get assignment history for a teacher
 * @param teacherId - The ID of the teacher
 * @returns Array of all assignments (active and inactive)
 */
export async function getAssignmentHistory(teacherId: string) {
  try {
    const assignments = await prisma.classTeacherAssignment.findMany({
      where: {
        teacherId: teacherId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return assignments;
  } catch (error) {
    console.error("Error fetching assignment history:", error);
    return [];
  }
}
