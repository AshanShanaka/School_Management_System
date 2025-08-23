import Announcements from "@/components/Announcements";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import DashboardCard from "@/components/DashboardCard";
import QuickActionCard from "@/components/QuickActionCard";
import prisma from "@/lib/prisma";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  // Fetch counts on the server
  const [adminCount, teacherCount, studentCount, parentCount] =
    await Promise.all([
      prisma.admin.count(),
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.parent.count(),
    ]);

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-blue-100">Manage your school system efficiently</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Admins"
          count={adminCount}
          icon="/home.png"
          href="/admin/settings"
          bgColor="bg-gradient-to-br from-purple-500 to-purple-700"
          description="System administrators"
        />
        <DashboardCard
          title="Teachers"
          count={teacherCount}
          icon="/teacher.png"
          href="/list/teachers"
          bgColor="bg-gradient-to-br from-blue-500 to-blue-700"
          description="Teaching staff"
        />
        <DashboardCard
          title="Students"
          count={studentCount}
          icon="/student.png"
          href="/list/students"
          bgColor="bg-gradient-to-br from-green-500 to-green-700"
          description="Enrolled students"
        />
        <DashboardCard
          title="Parents"
          count={parentCount}
          icon="/parent.png"
          href="/list/parents"
          bgColor="bg-gradient-to-br from-orange-500 to-orange-700"
          description="Parent accounts"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          title="Manage Classes"
          description="Create, edit, and organize classes and grades"
          icon="/class.png"
          href="/list/classes"
          bgColor="bg-white"
          iconBgColor="bg-blue-100"
        />
        <QuickActionCard
          title="Subjects & Lessons"
          description="Configure subjects and schedule lessons"
          icon="/subject.png"
          href="/list/subjects"
          bgColor="bg-white"
          iconBgColor="bg-purple-100"
        />
        <QuickActionCard
          title="Attendance Tracking"
          description="Monitor and manage student attendance"
          icon="/attendance.png"
          href="/admin/attendance"
          bgColor="bg-white"
          iconBgColor="bg-green-100"
        />
        <QuickActionCard
          title="CSV Import"
          description="Import students, teachers, and bulk data"
          icon="/upload.png"
          href="/admin/import"
          bgColor="bg-white"
          iconBgColor="bg-orange-100"
        />
        <QuickActionCard
          title="Timetable"
          description="View and manage school timetables"
          icon="/calendar.png"
          href="/timetables"
          bgColor="bg-white"
          iconBgColor="bg-indigo-100"
        />
        <QuickActionCard
          title="Exams & Results"
          description="Manage exams and student results"
          icon="/exam.png"
          href="/list/exams"
          bgColor="bg-white"
          iconBgColor="bg-red-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Analytics Overview
            </h2>
            <div className="h-[400px]">
              <CountChartContainer />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg">
            <EventCalendarContainer searchParams={searchParams} />
          </div>
          <div className="bg-white rounded-xl shadow-lg">
            <Announcements />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
