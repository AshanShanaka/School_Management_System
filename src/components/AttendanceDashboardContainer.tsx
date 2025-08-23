import { getCurrentUser } from "@/lib/auth";
import AttendanceDashboard from "./AttendanceDashboard";

const AttendanceDashboardContainer = async () => {
  const user = await getCurrentUser();
  const role = user?.role;

  if (!role) {
    return <div>Not authorized</div>;
  }

  try {
    // Fetch real attendance data from API
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
      }/api/attendance/stats`,
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch attendance data");
    }

    const data = await response.json();

    // Transform data based on role
    let attendanceData;

    if (role === "admin") {
      attendanceData = {
        overallStats: data.overallStats,
        classStats: data.classStats || [],
      };
    } else if (role === "teacher") {
      attendanceData = {
        overallStats: {
          totalStudents:
            data.teacherClassStats?.reduce(
              (sum: number, cls: any) => sum + cls.totalStudents,
              0
            ) || 0,
          presentToday:
            data.teacherClassStats?.reduce(
              (sum: number, cls: any) => sum + cls.presentToday,
              0
            ) || 0,
          absentToday:
            data.teacherClassStats?.reduce(
              (sum: number, cls: any) => sum + cls.absentToday,
              0
            ) || 0,
          lateToday:
            data.teacherClassStats?.reduce(
              (sum: number, cls: any) => sum + cls.lateToday,
              0
            ) || 0,
          attendanceRate:
            data.teacherClassStats?.length > 0
              ? data.teacherClassStats.reduce(
                  (sum: number, cls: any) => sum + cls.attendanceRate,
                  0
                ) / data.teacherClassStats.length
              : 0,
        },
        classStats: data.teacherClassStats || [],
      };
    } else if (role === "student") {
      attendanceData = {
        overallStats: {
          totalStudents: 1,
          presentToday: data.studentStats?.presentToday || 0,
          absentToday: data.studentStats?.absentToday || 0,
          lateToday: data.studentStats?.lateToday || 0,
          attendanceRate: data.studentStats?.monthlyAttendanceRate || 0,
        },
        classStats: [],
      };
    } else if (role === "parent") {
      const totalChildren = data.childrenStats?.length || 0;
      const presentToday =
        data.childrenStats?.reduce(
          (sum: number, child: any) => sum + child.presentToday,
          0
        ) || 0;
      const absentToday =
        data.childrenStats?.reduce(
          (sum: number, child: any) => sum + child.absentToday,
          0
        ) || 0;
      const lateToday =
        data.childrenStats?.reduce(
          (sum: number, child: any) => sum + child.lateToday,
          0
        ) || 0;
      const avgAttendanceRate =
        totalChildren > 0
          ? data.childrenStats.reduce(
              (sum: number, child: any) => sum + child.monthlyAttendanceRate,
              0
            ) / totalChildren
          : 0;

      attendanceData = {
        overallStats: {
          totalStudents: totalChildren,
          presentToday,
          absentToday,
          lateToday,
          attendanceRate: avgAttendanceRate,
        },
        classStats: [],
      };
    } else {
      attendanceData = {
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

    return <AttendanceDashboard {...attendanceData} userRole={role} />;
  } catch (error) {
    console.error("Error loading attendance data:", error);

    // Fallback to basic data structure if API fails
    const fallbackData = {
      overallStats: {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        attendanceRate: 0,
      },
      classStats: [],
    };

    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-md">
        <h3 className="text-red-800 font-semibold mb-2">
          Unable to load attendance data
        </h3>
        <p className="text-red-600 text-sm">
          Please try refreshing the page or contact system administrator.
        </p>
        <details className="mt-2">
          <summary className="text-red-700 cursor-pointer">
            Error details
          </summary>
          <pre className="text-xs text-red-600 mt-1">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
        </details>
      </div>
    );
  }
};

export default AttendanceDashboardContainer;
