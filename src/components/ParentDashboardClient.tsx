"use client";

import { useTranslation } from "@/contexts/TranslationContext";
import { useTranslatedText } from "@/hooks/useTranslatedText";
import DashboardCard from "@/components/DashboardCard";
import QuickActionCard from "@/components/QuickActionCard";
import {
  Calendar,
  ClipboardCheck,
  FileText,
  Mail,
  Users,
  BookOpen,
} from "lucide-react";

interface Child {
  id: string;
  name: string;
  surname: string;
  class: {
    name: string;
    _count: {
      students: number;
    };
  };
  _count: {
    attendances: number;
  };
}

interface Exam {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

interface ParentDashboardClientProps {
  childrenCount: number;
  attendanceRate: number;
  upcomingExamsCount: number;
  unreadMessagesCount: number;
  children: Child[];
  recentAttendance: any[];
  upcomingExams: Exam[];
}

export default function ParentDashboardClient({
  childrenCount,
  attendanceRate,
  upcomingExamsCount,
  unreadMessagesCount,
  children: childrenData,
  recentAttendance,
  upcomingExams,
}: ParentDashboardClientProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          type="myChildren"
          count={childrenCount}
          label={t("parent.myChildren")}
          description={t("parent.enrolledChildren")}
        />
        <DashboardCard
          type="attendance"
          count={`${attendanceRate.toFixed(1)}%`}
          label={t("parent.attendanceRate")}
          description={t("parent.last7Days")}
        />
        <DashboardCard
          type="upcomingExams"
          count={upcomingExamsCount}
          label={t("parent.upcomingExams")}
          description={t("parent.thisMonth")}
        />
        <DashboardCard
          type="messages"
          count={unreadMessagesCount}
          label={t("parent.messages")}
          description={t("parent.unreadMessages")}
        />
      </div>

      {/* Quick Actions Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("parent.quickActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            icon={<ClipboardCheck className="w-8 h-8" />}
            title={t("parent.childrenAttendance")}
            description={t("parent.viewDetailedAttendance")}
            href="/list/attendance"
            color="bg-blue-500"
          />
          <QuickActionCard
            icon={<FileText className="w-8 h-8" />}
            title={t("parent.academicResults")}
            description={t("parent.viewExamResults")}
            href="/list/results"
            color="bg-green-500"
          />
          <QuickActionCard
            icon={<Calendar className="w-8 h-8" />}
            title={t("parent.timetable")}
            description={t("parent.checkClassSchedules")}
            href="/list/lessons"
            color="bg-purple-500"
          />
          <QuickActionCard
            icon={<BookOpen className="w-8 h-8" />}
            title={t("parent.assignments")}
            description={t("parent.trackHomework")}
            href="/list/assignments"
            color="bg-yellow-500"
          />
          <QuickActionCard
            icon={<Calendar className="w-8 h-8" />}
            title={t("parent.schoolEvents")}
            description={t("parent.stayUpdated")}
            href="/list/events"
            color="bg-pink-500"
          />
          <QuickActionCard
            icon={<Mail className="w-8 h-8" />}
            title={t("parent.contactTeachers")}
            description={t("parent.sendMessages")}
            href="/list/messages"
            color="bg-indigo-500"
          />
        </div>
      </section>

      {/* Children & Attendance Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t("parent.myChildren")}</h2>
        </div>

        {childrenData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t("parent.noChildrenRegistered")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenData.map((child) => {
              const childAttendance = recentAttendance.filter(
                (att) => att.studentId === child.id
              );
              const presentDays = childAttendance.filter(
                (att) => att.present
              ).length;
              const totalDays = childAttendance.length;
              const attendancePercentage =
                totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

              return (
                <div
                  key={child.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div className="bg-gradient-to-r from-lamaSky to-lamaSkyLight p-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {child.name} {child.surname}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("children.class")}: {child.class.name}
                    </p>
                  </div>

                  <div className="p-4">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          {t("parent.recentAttendance")}
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          {attendancePercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            attendancePercentage >= 90
                              ? "bg-green-500"
                              : attendancePercentage >= 75
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${attendancePercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("parent.last5Days")}
                      </p>
                    </div>

                    <div className="flex gap-1 mb-4">
                      {childAttendance.slice(0, 5).map((att, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 h-8 rounded ${
                            att.present
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                          title={`${new Date(att.date).toLocaleDateString()}: ${
                            att.present
                              ? t("attendance.present")
                              : t("attendance.absent")
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/list/students/${child.id}`}
                        className="flex-1 bg-lamaSky hover:bg-lamaSkyLight text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                      >
                        {t("parent.viewDetails")}
                      </a>
                      <a
                        href={`/list/students/${child.id}`}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
                      >
                        {t("parent.fullProfile")}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Attendance Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {t("parent.recentAttendance")}
        </h2>
        {recentAttendance.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t("parent.noRecentAttendance")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("children.name")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("attendance.date")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("attendance.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAttendance.slice(0, 10).map((attendance) => (
                    <tr
                      key={attendance.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attendance.student.name} {attendance.student.surname}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attendance.student.class.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attendance.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            attendance.present
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {attendance.present
                            ? t("attendance.present")
                            : t("attendance.absent")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Upcoming Exams Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {t("parent.upcomingExams")}
        </h2>
        {upcomingExams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t("dashboard.noData")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                  <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {exam.startTime
                        ? new Date(exam.startTime).toLocaleDateString()
                        : t("parent.notScheduled")}
                    </span>
                  </div>
                  {exam.startTime && (
                    <div className="text-xs text-gray-500">
                      {t("parent.at")}{" "}
                      {new Date(exam.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
