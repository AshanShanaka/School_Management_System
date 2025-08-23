import TimetableView from "@/components/TimetableView";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";

const TimetableDetailPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  // Get timetable with all related data using modern structure
  const timetable = await prisma.timetable.findUnique({
    where: { id: parseInt(id) },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
      slots: {
        include: {
          subject: true,
          teacher: true,
        },
        orderBy: [{ day: "asc" }, { period: "asc" }],
      },
    },
  });

  if (!timetable) {
    return notFound();
  }

  // Check permissions
  let hasPermission = false;

  if (role === "admin") {
    hasPermission = true;
  } else if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: user?.id },
    });
    hasPermission = student?.classId === timetable.classId;
  } else if (role === "parent") {
    const parent = await prisma.parent.findUnique({
      where: { id: user?.id },
    });
    const children = await prisma.student.findMany({
      where: { parentId: parent?.id },
      select: { classId: true },
    });
    hasPermission = children.some(child => child.classId === timetable.classId);
  } else if (role === "teacher") {
    const teacher = await prisma.teacher.findUnique({
      where: { id: user?.id },
    });
    const assignments = await prisma.subjectAssignment.findMany({
      where: { teacherId: teacher?.id },
      select: { classId: true },
    });
    hasPermission = assignments.some(assignment => assignment.classId === timetable.classId);
  }

  if (!hasPermission) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-600">You don't have permission to view this timetable.</p>
          <Link 
            href="/list/timetables"
            className="inline-flex items-center mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Timetables
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/list/timetables"
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Timetables
        </Link>
        
        <div className="flex items-center space-x-3">
          {role === "admin" && (
            <Link 
              href={`/timetables?class=${timetable.classId}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Timetable
            </Link>
          )}
        </div>
      </div>

      {/* Modern Timetable View */}
      <TimetableView timetable={timetable} userRole={role} />
    </div>
  );
};

export default TimetableDetailPage;
