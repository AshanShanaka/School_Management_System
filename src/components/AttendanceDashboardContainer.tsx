import { auth } from "@clerk/nextjs/server";
import AttendanceDashboard from "./AttendanceDashboard";

const AttendanceDashboardContainer = async () => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!role) {
    return <div>Not authorized</div>;
  }

  try {
    // In a real app, you'd fetch from your API here
    // For now, let's use mock data based on role
    const mockData = await getMockAttendanceData(role);

    return <AttendanceDashboard {...mockData} userRole={role} />;
  } catch (error) {
    console.error("Error loading attendance data:", error);
    return <div>Error loading attendance data</div>;
  }
};

// Mock data function - replace with actual API call
async function getMockAttendanceData(role: string) {
  if (role === "admin") {
    return {
      overallStats: {
        totalStudents: 1240,
        presentToday: 1156,
        absentToday: 64,
        lateToday: 20,
        attendanceRate: 93.2,
      },
      classStats: [
        {
          classId: 1,
          className: "A",
          gradeLevel: 1,
          totalStudents: 30,
          presentToday: 28,
          absentToday: 2,
          lateToday: 1,
          attendanceRate: 93.3,
        },
        {
          classId: 2,
          className: "B",
          gradeLevel: 1,
          totalStudents: 32,
          presentToday: 30,
          absentToday: 2,
          lateToday: 0,
          attendanceRate: 93.8,
        },
        {
          classId: 3,
          className: "A",
          gradeLevel: 2,
          totalStudents: 28,
          presentToday: 26,
          absentToday: 2,
          lateToday: 1,
          attendanceRate: 92.9,
        },
        {
          classId: 4,
          className: "B",
          gradeLevel: 2,
          totalStudents: 31,
          presentToday: 29,
          absentToday: 2,
          lateToday: 0,
          attendanceRate: 93.5,
        },
        {
          classId: 5,
          className: "A",
          gradeLevel: 3,
          totalStudents: 29,
          presentToday: 27,
          absentToday: 2,
          lateToday: 2,
          attendanceRate: 93.1,
        },
      ],
    };
  } else if (role === "student") {
    return {
      overallStats: {
        totalStudents: 1,
        presentToday: 1,
        absentToday: 0,
        lateToday: 0,
        attendanceRate: 95.5,
      },
      classStats: [],
    };
  } else if (role === "parent") {
    return {
      overallStats: {
        totalStudents: 2, // 2 children
        presentToday: 2,
        absentToday: 0,
        lateToday: 0,
        attendanceRate: 94.2,
      },
      classStats: [],
    };
  } else {
    return {
      overallStats: {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        attendanceRate: 0,
      },
      classStats: [],
    };
  }
}

export default AttendanceDashboardContainer;
