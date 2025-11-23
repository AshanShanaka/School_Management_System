import Announcements from "@/components/Announcements";
import ParentDashboardContent from "@/components/ParentDashboardContent";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ParentPage = async () => {
  const user = await getCurrentUser();

  // Get parent data with children
  const parent = await prisma.parent.findUnique({
    where: { id: user?.id },
    include: {
      students: {
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
      },
    },
  });

  // Get recent attendance for all children
  const recentAttendance = await prisma.attendance.findMany({
    where: {
      studentId: {
        in: parent?.students.map((s) => s.id) || [],
      },
      date: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    include: {
      student: true,
      class: true,
      teacher: true,
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  // Get upcoming exams for children
  const upcomingExams = await prisma.exam.findMany({
    where: {
      publishedAt: {
        not: null,
      },
      status: "PUBLISHED",
    },
    include: {
      grade: true,
      class: true,
      examType: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalChildren = parent?.students.length || 0;
  const attendanceRate =
    recentAttendance.length > 0
      ? Math.round(
          (recentAttendance.filter((a) => a.present).length /
            recentAttendance.length) *
            100
        )
      : 100;

  return (
    <div className="p-6 space-y-8">
      {/* Language Switcher - Floating button */}
      <LanguageSwitcher />

      {/* Parent Dashboard Content - Client Component for Translation */}
      <ParentDashboardContent
        parentName={parent?.name || ""}
        parentSurname={parent?.surname || ""}
        totalChildren={totalChildren}
        attendanceRate={attendanceRate}
        upcomingExamsCount={upcomingExams.length}
        students={parent?.students || []}
        recentAttendance={recentAttendance}
        upcomingExams={upcomingExams}
      />

      {/* Announcements */}
      <div className="bg-white rounded-xl shadow-lg">
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
