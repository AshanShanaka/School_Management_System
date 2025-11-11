"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

interface ClassTeacherDashboardClientProps {
  teacherId: string;
}

const ClassTeacherDashboardClient: React.FC<ClassTeacherDashboardClientProps> = ({ teacherId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [teacherId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/class-teacher/dashboard?teacherId=${teacherId}`);
      
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("An error occurred while loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.isClassTeacher) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Not Assigned as Class Teacher
          </h2>
          <p className="text-yellow-700">
            {data?.message || "You are currently not assigned as a class teacher for any class. Please contact the administrator if you believe this is an error."}
          </p>
        </div>
      </div>
    );
  }

  const { teacher, class: classInfo, students, attendance, recentAnnouncements, upcomingMeetings, unreadMessagesCount } = data;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Class Teacher Dashboard
        </h1>
        <div className="flex items-center gap-4">
          {teacher?.img && (
            <Image
              src={teacher.img}
              alt={teacher.name}
              width={60}
              height={60}
              className="rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-lg font-semibold text-gray-700">
              {teacher?.name}
            </p>
            <p className="text-sm text-gray-500">
              Class Teacher - {classInfo?.name} (Grade {classInfo?.grade?.level})
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">{attendance?.totalStudents || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800 mb-1">Present Today</h3>
          <p className="text-3xl font-bold text-green-600">{attendance?.presentToday || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-sm font-medium text-red-800 mb-1">Absent Today</h3>
          <p className="text-3xl font-bold text-red-600">{attendance?.absentToday || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800 mb-1">Attendance Rate</h3>
          <p className="text-3xl font-bold text-purple-600">{attendance?.attendanceRate || 0}%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Mark Attendance
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
            Send Message to Parents
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition">
            Schedule Meeting
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition">
            Create Announcement
          </button>
        </div>
      </div>

      {/* Students and Parents List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Students & Parents ({students?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Photo</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Student Name</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Username</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Sex</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Parent Name</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Parent Contact</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students?.map((student: any) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    {student.img ? (
                      <Image
                        src={student.img}
                        alt={student.fullName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-sm">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{student.fullName}</div>
                    <div className="text-xs text-gray-500">{student.email || "No email"}</div>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{student.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      student.sex === "MALE" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-pink-100 text-pink-700"
                    }`}>
                      {student.sex}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{student.parent.fullName}</div>
                    <div className="text-xs text-gray-500">{student.parent.email || "No email"}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-gray-700">{student.parent.phone}</div>
                    <div className="text-xs text-gray-500">{student.parent.address}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition"
                        title="Message Parent"
                      >
                        Message
                      </button>
                      <button 
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition"
                        title="Schedule Meeting"
                      >
                        Meet
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!students || students.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No students found in this class
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings && upcomingMeetings.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Meetings ({upcomingMeetings.length})
          </h2>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting: any) => (
              <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{meeting.parent.name}</p>
                    <p className="text-sm text-gray-600">
                      Student: {meeting.student?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(meeting.scheduledDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      meeting.meetingType === "IN_PERSON"
                        ? "bg-blue-100 text-blue-700"
                        : meeting.meetingType === "ONLINE"
                        ? "bg-green-100 text-green-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {meeting.meetingType}
                    </span>
                    <p className="text-sm text-gray-600 mt-2">{meeting.parent.phone}</p>
                  </div>
                </div>
                {meeting.purpose && (
                  <p className="text-sm text-gray-600 mt-2 italic">"{meeting.purpose}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Announcements */}
      {recentAnnouncements && recentAnnouncements.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Announcements
          </h2>
          <div className="space-y-3">
            {recentAnnouncements.map((announcement: any) => (
              <div key={announcement.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    announcement.priority === "HIGH"
                      ? "bg-red-100 text-red-700"
                      : announcement.priority === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {announcement.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{announcement.content}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    To: {announcement.audience}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTeacherDashboardClient;
