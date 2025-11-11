import Announcements from "@/components/Announcements";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import ModernDashboardCard from "@/components/ModernDashboardCard";
import ModernActionCard from "@/components/ModernActionCard";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  
  // Fetch counts on the server
  const [adminCount, teacherCount, studentCount, parentCount] =
    await Promise.all([
      prisma.admin.count(),
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.parent.count(),
    ]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-10 shadow-medium">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                Welcome back, Admin!
                <span className="animate-bounce-gentle">👋</span>
              </h1>
              <p className="text-primary-100 text-base">Here's what's happening in your school today</p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-white">
              <div className="text-right border-l border-primary-500 pl-6">
                <p className="text-xs text-primary-200 uppercase tracking-wide mb-1">Today</p>
                <p className="text-lg font-semibold">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ModernDashboardCard
            title="Total Teachers"
            count={teacherCount}
            icon="/teacher.png"
            href="/list/teachers"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <ModernDashboardCard
            title="Total Students"
            count={studentCount}
            icon="/student.png"
            href="/list/students"
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <ModernDashboardCard
            title="Total Parents"
            count={parentCount}
            icon="/parent.png"
            href="/list/parents"
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <ModernDashboardCard
            title="Administrators"
            count={adminCount}
            icon="/home.png"
            href="/admin/settings"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-soft border border-neutral-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Quick Actions</h2>
              <p className="text-sm text-neutral-500">Common tasks and shortcuts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModernActionCard
              title="Manage Classes"
              description="Create and organize classes"
              icon="/class.png"
              href="/list/classes"
              iconBgColor="bg-blue-100"
            />
            <ModernActionCard
              title="Subjects & Lessons"
              description="Configure subjects and schedules"
              icon="/subject.png"
              href="/list/subjects"
              iconBgColor="bg-purple-100"
            />
            <ModernActionCard
              title="Attendance Tracking"
              description="Monitor student attendance"
              icon="/attendance.png"
              href="/admin/attendance"
              iconBgColor="bg-green-100"
            />
            <ModernActionCard
              title="CSV Import"
              description="Import bulk data"
              icon="/upload.png"
              href="/admin/import"
              iconBgColor="bg-orange-100"
            />
            <ModernActionCard
              title="Timetable"
              description="Manage school timetables"
              icon="/calendar.png"
              href="/admin/timetable"
              iconBgColor="bg-indigo-100"
            />
            <ModernActionCard
              title="Exams & Results"
              description="Manage exams and results"
              icon="/exam.png"
              href="/list/exams"
              iconBgColor="bg-red-100"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Analytics Overview</h2>
                  <p className="text-sm text-neutral-500">Performance metrics and trends</p>
                </div>
              </div>
              <div className="h-[400px]">
                <CountChartContainer />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
              <EventCalendarContainer searchParams={searchParams} />
            </div>
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
              <Announcements />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
