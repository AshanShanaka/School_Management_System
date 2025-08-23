import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DebugAccessPage = async () => {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="p-6">Not logged in</div>;
  }

  let debugInfo: any = {
    user: user,
    accessInfo: {},
  };

  try {
    if (user.role === "admin") {
      const [studentCount, teacherCount, parentCount] = await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.parent.count(),
      ]);
      debugInfo.accessInfo = {
        canSeeStudents: studentCount,
        canSeeTeachers: teacherCount,
        canSeeParents: parentCount,
      };
    } else if (user.role === "teacher") {
      // Get teacher's classes
      const teacherClasses = await prisma.class.findMany({
        where: {
          OR: [
            { supervisorId: user.id },
            {
              subjectAssignments: {
                some: { teacherId: user.id },
              },
            },
          ],
        },
        include: { students: true },
      });

      const studentIds = teacherClasses.flatMap((c) =>
        c.students.map((s) => s.id)
      );
      const parentIds = teacherClasses.flatMap((c) =>
        c.students.map((s) => s.parentId)
      );

      debugInfo.accessInfo = {
        teacherClasses: teacherClasses.map((c) => ({ id: c.id, name: c.name })),
        canSeeStudents: studentIds.length,
        canSeeParents: Array.from(new Set(parentIds)).length, // unique parents
        canSeeTeachers: 1, // themselves
      };
    } else if (user.role === "student") {
      const student = await prisma.student.findUnique({
        where: { id: user.id },
        include: {
          class: {
            include: {
              students: true,
              subjectAssignments: {
                include: { teacher: true },
              },
            },
          },
          parent: true,
        },
      });

      debugInfo.accessInfo = {
        class: student?.class
          ? { id: student.class.id, name: student.class.name }
          : null,
        canSeeStudents: 1, // themselves only
        canSeeTeachers: student?.class?.subjectAssignments?.length || 0,
        canSeeParents: student?.parent ? 1 : 0,
      };
    } else if (user.role === "parent") {
      const children = await prisma.student.findMany({
        where: { parentId: user.id },
        include: {
          class: {
            include: {
              subjectAssignments: {
                include: { teacher: true },
              },
            },
          },
        },
      });

      const teacherIds = children.flatMap((child) =>
        child.class.subjectAssignments.map((sa) => sa.teacherId)
      );

      debugInfo.accessInfo = {
        children: children.map((c) => ({
          id: c.id,
          name: `${c.name} ${c.surname}`,
          class: c.class.name,
        })),
        canSeeStudents: children.length,
        canSeeTeachers: Array.from(new Set(teacherIds)).length,
        canSeeParents: 1, // themselves
      };
    }
  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Access Debug Information
      </h1>

      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-800">
            Current User
          </h2>
          <pre className="text-sm text-blue-700 whitespace-pre-wrap">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-green-800">
            Access Information
          </h2>
          <pre className="text-sm text-green-700 whitespace-pre-wrap">
            {JSON.stringify(debugInfo.accessInfo, null, 2)}
          </pre>
        </div>

        {debugInfo.error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
            <p className="text-sm text-red-700">{debugInfo.error}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            Navigation Links
          </h2>
          <div className="space-y-2">
            <a
              href="/list/students"
              className="block text-blue-600 hover:underline"
            >
              → View Students
            </a>
            <a
              href="/list/teachers"
              className="block text-blue-600 hover:underline"
            >
              → View Teachers
            </a>
            <a
              href="/list/parents"
              className="block text-blue-600 hover:underline"
            >
              → View Parents
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAccessPage;
