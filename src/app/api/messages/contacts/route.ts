import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/messages/contacts - Get list of users current user can message
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let contacts = [];

    if (user.role === "student") {
      // Students can message their teachers
      const student = await prisma.student.findUnique({
        where: { id: user.id },
        include: {
          class: {
            include: {
              subjectAssignments: {
                include: {
                  teacher: {
                    select: {
                      id: true,
                      name: true,
                      surname: true,
                      email: true
                    }
                  },
                  subject: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (student?.class) {
        // Get unique teachers for this student's class
        const teacherMap = new Map();
        student.class.subjectAssignments.forEach(assignment => {
          if (!teacherMap.has(assignment.teacher.id)) {
            teacherMap.set(assignment.teacher.id, {
              ...assignment.teacher,
              role: "teacher",
              subjects: [assignment.subject.name]
            });
          } else {
            teacherMap.get(assignment.teacher.id).subjects.push(assignment.subject.name);
          }
        });

        contacts = Array.from(teacherMap.values());
      }
    } else if (user.role === "parent") {
      // Parents can message their children's teachers
      const parent = await prisma.parent.findUnique({
        where: { id: user.id },
        include: {
          students: {
            include: {
              class: {
                include: {
                  subjectAssignments: {
                    include: {
                      teacher: {
                        select: {
                          id: true,
                          name: true,
                          surname: true,
                          email: true
                        }
                      },
                      subject: {
                        select: {
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (parent?.students) {
        const teacherMap = new Map();
        
        parent.students.forEach(student => {
          if (student.class) {
            student.class.subjectAssignments.forEach(assignment => {
              const teacherId = assignment.teacher.id;
              if (!teacherMap.has(teacherId)) {
                teacherMap.set(teacherId, {
                  ...assignment.teacher,
                  role: "teacher",
                  subjects: [assignment.subject.name],
                  studentNames: [student.name + " " + student.surname]
                });
              } else {
                const teacher = teacherMap.get(teacherId);
                if (!teacher.subjects.includes(assignment.subject.name)) {
                  teacher.subjects.push(assignment.subject.name);
                }
                const studentName = student.name + " " + student.surname;
                if (!teacher.studentNames.includes(studentName)) {
                  teacher.studentNames.push(studentName);
                }
              }
            });
          }
        });

        contacts = Array.from(teacherMap.values());
      }
    } else if (user.role === "teacher") {
      // Teachers can message their students and their students' parents
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        include: {
          subjectAssignments: {
            include: {
              class: {
                include: {
                  students: {
                    include: {
                      parent: {
                        select: {
                          id: true,
                          name: true,
                          surname: true,
                          email: true
                        }
                      }
                    }
                  }
                }
              },
              subject: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (teacher?.subjectAssignments) {
        const studentMap = new Map();
        const parentMap = new Map();

        teacher.subjectAssignments.forEach(assignment => {
          assignment.class.students.forEach(student => {
            // Add student
            if (!studentMap.has(student.id)) {
              studentMap.set(student.id, {
                id: student.id,
                name: student.name,
                surname: student.surname,
                username: student.username,
                role: "student",
                className: assignment.class.name,
                subjects: [assignment.subject.name]
              });
            } else {
              const existingStudent = studentMap.get(student.id);
              if (!existingStudent.subjects.includes(assignment.subject.name)) {
                existingStudent.subjects.push(assignment.subject.name);
              }
            }

            // Add parent if exists
            if (student.parent && !parentMap.has(student.parent.id)) {
              parentMap.set(student.parent.id, {
                ...student.parent,
                role: "parent",
                childName: student.name + " " + student.surname,
                className: assignment.class.name
              });
            }
          });
        });

        contacts = [
          ...Array.from(studentMap.values()),
          ...Array.from(parentMap.values())
        ];
      }
    } else if (user.role === "admin") {
      // Admin can message everyone
      const teachers = await prisma.teacher.findMany({
        select: {
          id: true,
          name: true,
          surname: true,
          email: true
        }
      });

      const students = await prisma.student.findMany({
        select: {
          id: true,
          name: true,
          surname: true,
          username: true
        }
      });

      const parents = await prisma.parent.findMany({
        select: {
          id: true,
          name: true,
          surname: true,
          email: true
        }
      });

      contacts = [
        ...teachers.map(t => ({ ...t, role: "teacher" })),
        ...students.map(s => ({ ...s, role: "student" })),
        ...parents.map(p => ({ ...p, role: "parent" }))
      ];
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
