"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import DashboardCard from "@/components/DashboardCard";
import QuickActionCard from "@/components/QuickActionCard";
import Image from "next/image";
import Link from "next/link";

interface ParentDashboardContentProps {
  parentName: string;
  parentSurname: string;
  totalChildren: number;
  attendanceRate: number;
  upcomingExamsCount: number;
  students: any[];
  recentAttendance: any[];
  upcomingExams: any[];
}

export default function ParentDashboardContent({
  parentName,
  parentSurname,
  totalChildren,
  attendanceRate,
  upcomingExamsCount,
  students,
  recentAttendance,
  upcomingExams,
}: ParentDashboardContentProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 rounded-full p-3">
            <Image src="/parent.png" alt="Parent" width={32} height={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {t("parent.welcomeBack")}, {parentName} {parentSurname}
            </h1>
            <p className="text-purple-100">
              {t("parent.dashboardSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title={t("parent.myChildren")}
          count={totalChildren}
          icon="/student.png"
          href="/parent/children"
          bgColor="bg-gradient-to-br from-blue-500 to-blue-700"
          description={t("parent.enrolledChildren")}
        />
        <DashboardCard
          title={t("parent.attendanceRate")}
          count={attendanceRate}
          icon="/attendance.png"
          href="/parent/attendance"
          bgColor="bg-gradient-to-br from-green-500 to-green-700"
          description={t("parent.last7Days")}
        />
        <DashboardCard
          title={t("parent.upcomingExams")}
          count={upcomingExamsCount}
          icon="/exam.png"
          href="/list/exams"
          bgColor="bg-gradient-to-br from-orange-500 to-orange-700"
          description={t("parent.thisMonth")}
        />
        <DashboardCard
          title={t("parent.messages")}
          count={0}
          icon="/message.png"
          href="/list/messages"
          bgColor="bg-gradient-to-br from-purple-500 to-purple-700"
          description={t("parent.unreadMessages")}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("parent.quickActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title={t("parent.childrenAttendance")}
            description={t("parent.viewDetailedAttendance")}
            icon="/attendance.png"
            href="/parent/attendance"
            bgColor="bg-white"
            iconBgColor="bg-green-100"
          />
          <QuickActionCard
            title={t("parent.academicResults")}
            description={t("parent.viewExamResults")}
            icon="/result.png"
            href="/list/results"
            bgColor="bg-white"
            iconBgColor="bg-blue-100"
          />
          <QuickActionCard
            title={t("parent.timetable")}
            description={t("parent.checkClassSchedules")}
            icon="/calendar.png"
            href="/parent/timetable"
            bgColor="bg-white"
            iconBgColor="bg-purple-100"
          />
          <QuickActionCard
            title={t("parent.assignments")}
            description={t("parent.trackHomework")}
            icon="/assignment.png"
            href="/list/assignments"
            bgColor="bg-white"
            iconBgColor="bg-orange-100"
          />
          <QuickActionCard
            title={t("parent.schoolEvents")}
            description={t("parent.stayUpdated")}
            icon="/calendar.png"
            href="/list/events"
            bgColor="bg-white"
            iconBgColor="bg-indigo-100"
          />
          <QuickActionCard
            title={t("parent.contactTeachers")}
            description={t("parent.sendMessages")}
            icon="/message.png"
            href="/list/messages"
            bgColor="bg-white"
            iconBgColor="bg-pink-100"
          />
        </div>
      </div>

      {/* Children List and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Children Cards */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/student.png"
              alt="Students"
              width={24}
              height={24}
              className="mr-2"
            />
            {t("parent.myChildren")}
          </h2>
          {students && students.length > 0 ? (
            <div className="space-y-4">
              {students.map((student) => {
                // Calculate attendance for this child
                const studentAttendance = recentAttendance.filter(
                  (att) => att.studentId === student.id
                );
                const presentCount = studentAttendance.filter(
                  (att) => att.present
                ).length;
                const studentAttendanceRate =
                  studentAttendance.length > 0
                    ? Math.round(
                        (presentCount / studentAttendance.length) * 100
                      )
                    : 0;

                return (
                  <div
                    key={student.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Link
                          href={`/list/students/${student.id}`}
                          className="font-semibold text-gray-800 hover:text-blue-600"
                        >
                          {student.name} {student.surname}
                        </Link>
                        <div className="text-sm text-gray-600">
                          {student.class.grade.level} - {student.class.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            studentAttendanceRate >= 90
                              ? "text-green-600"
                              : studentAttendanceRate >= 75
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {studentAttendanceRate}%
                        </div>
                        <div className="text-xs text-gray-500">{t("attendance.title")}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/list/students/${student.id}`}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                      >
                        {t("parent.viewDetails")}
                      </Link>
                      <Link
                        href={`/list/students/${student.id}`}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                      >
                        {t("parent.fullProfile")}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t("parent.noChildrenRegistered")}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/attendance.png"
              alt="Attendance"
              width={24}
              height={24}
              className="mr-2"
            />
            {t("parent.recentAttendance")}
          </h2>
          <div className="space-y-3">
            {recentAttendance.length > 0 ? (
              recentAttendance.slice(0, 5).map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex justify-between items-center border-b border-gray-200 pb-3 last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {attendance.student.name} {attendance.student.surname}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(attendance.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      attendance.present
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {attendance.present ? t("attendance.present") : t("attendance.absent")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>{t("parent.noRecentAttendance")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Image
              src="/exam.png"
              alt="Exams"
              width={24}
              height={24}
              className="mr-2"
            />
            {t("parent.upcomingExams")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="font-medium text-gray-800">{exam.title}</div>
                <div className="text-sm text-gray-600 mb-2">{t("menu.exams")}</div>
                <div className="text-sm text-blue-600 font-medium">
                  {exam.publishedAt?.toLocaleDateString() || t("parent.notScheduled")}{" "}
                  {exam.publishedAt && t("parent.at")}{" "}
                  {exam.publishedAt?.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
