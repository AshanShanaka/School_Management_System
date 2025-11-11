import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = user?.role;
    const userId = user?.id;

    if (role !== "teacher" && role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { studentId, classId } = await request.json();

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: "Student ID and Class ID are required" },
        { status: 400 }
      );
    }

    // Get student and parent details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: true,
        class: {
          include: {
            grade: true,
            supervisor: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify teacher is supervisor (if role is teacher)
    if (role === "teacher" && student.class.supervisorId !== user?.id) {
      return NextResponse.json(
        { error: "You are not authorized to send alerts for this student" },
        { status: 403 }
      );
    }

    // Get recent attendance data
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        studentId: studentId,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    const totalDays = recentAttendance.length;
    const presentDays = recentAttendance.filter((a) => a.present).length;
    const absentDays = totalDays - presentDays;
    const attendanceRate =
      totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

    // Calculate consecutive absences
    let consecutiveAbsences = 0;
    for (const attendance of recentAttendance) {
      if (!attendance.present) {
        consecutiveAbsences++;
      } else {
        break;
      }
    }

    // Here you would typically send an email or SMS
    // For now, we'll just log the alert and create a notification record

    // You can integrate with email services like SendGrid, AWS SES, or SMS services like Twilio
    const alertMessage = `
Absence Alert for ${student.name} ${student.surname}

Dear ${student.parent.name} ${student.parent.surname},

This is an automated attendance alert for your child ${student.name} ${
      student.surname
    } in Grade ${student.class.name}.

Attendance Summary (Last 30 days):
- Total Days: ${totalDays}
- Present: ${presentDays} days
- Absent: ${absentDays} days  
- Attendance Rate: ${attendanceRate.toFixed(1)}%
- Consecutive Absences: ${consecutiveAbsences} days

${
  consecutiveAbsences >= 5
    ? "⚠️ CRITICAL: Your child has been absent for 5 or more consecutive days."
    : consecutiveAbsences >= 3
    ? "⚠️ WARNING: Your child has been absent for 3 or more consecutive days."
    : "Please ensure regular attendance for your child's academic success."
}

Class Teacher: ${student.class.supervisor?.name} ${
      student.class.supervisor?.surname
    }
School Contact: [School Phone Number]

Best regards,
School Administration
    `;

    console.log("Absence Alert:", alertMessage);

    // In a real implementation, you would send the alert via email/SMS here
    // await sendEmail(student.parent.email, "Attendance Alert", alertMessage);
    // await sendSMS(student.parent.phone, alertMessage);

    // Create a notification record for tracking
    // You might want to add a notifications table to track sent alerts

    return NextResponse.json({
      success: true,
      message: "Absence alert sent successfully",
      alertDetails: {
        studentName: `${student.name} ${student.surname}`,
        parentName: `${student.parent.name} ${student.parent.surname}`,
        attendanceRate: attendanceRate.toFixed(1),
        consecutiveAbsences,
        alertSentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error sending absence alert:", error);
    return NextResponse.json(
      { error: "Failed to send absence alert" },
      { status: 500 }
    );
  }
}
