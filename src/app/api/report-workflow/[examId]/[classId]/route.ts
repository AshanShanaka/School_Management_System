import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/report-workflow/[examId]/[classId] - Get workflow status
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string; classId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const classId = parseInt(params.classId);

    // Get workflow status
    const workflow = await prisma.reportWorkflow.findUnique({
      where: {
        examId_classId: {
          examId,
          classId,
        },
      },
      include: {
        exam: {
          include: { grade: true },
        },
        class: true,
        classReviewer: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        adminApprover: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Get exam subjects and their completion status
    const examSubjects = await prisma.examSubject.findMany({
      where: { examId },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Get report cards count
    const reportCardsCount = await prisma.reportCard.count({
      where: { examId, classId },
    });

    // Get students count
    const studentsCount = await prisma.student.count({
      where: { classId },
    });

    const subjectsStatus = examSubjects.map(subject => ({
      id: subject.id,
      subjectName: subject.subject.name,
      teacherName: subject.teacher ? `${subject.teacher.name} ${subject.teacher.surname}` : "No teacher assigned",
      marksEntered: subject.marksEntered,
      marksEnteredAt: subject.marksEnteredAt,
      maxMarks: subject.maxMarks,
    }));

    const completedSubjects = examSubjects.filter(s => s.marksEntered).length;
    const totalSubjects = examSubjects.length;
    const marksProgress = totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0;

    return NextResponse.json({
      workflow: workflow || {
        examId,
        classId,
        currentStage: "MARKS_ENTRY",
        marksComplete: false,
        classReviewed: false,
        adminApproved: false,
        published: false,
      },
      subjects: subjectsStatus,
      progress: {
        completedSubjects,
        totalSubjects,
        marksProgress,
        reportCardsGenerated: reportCardsCount,
        totalStudents: studentsCount,
      },
    });

  } catch (error) {
    console.error("Error fetching workflow status:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow status" },
      { status: 500 }
    );
  }
}

// POST /api/report-workflow/[examId]/[classId] - Update workflow stage
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string; classId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const classId = parseInt(params.classId);

    const body = await request.json();
    const { action, teacherComment, principalComment } = body;

    switch (action) {
      case "submit_for_review":
        // Class teacher submits for admin review
        if (user.role !== "teacher") {
          return NextResponse.json(
            { error: "Only class teachers can submit for review" },
            { status: 403 }
          );
        }

        // Check if user is class teacher
        const classTeacher = await prisma.class.findFirst({
          where: {
            id: classId,
            supervisorId: user.id,
          },
        });

        if (!classTeacher) {
          return NextResponse.json(
            { error: "You are not the class teacher for this class" },
            { status: 403 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // Update workflow
          await tx.reportWorkflow.upsert({
            where: {
              examId_classId: {
                examId,
                classId,
              },
            },
            create: {
              examId,
              classId,
              currentStage: "ADMIN_REVIEW",
              marksComplete: true,
              classReviewed: true,
              classReviewedBy: user.id,
              classReviewedAt: new Date(),
            },
            update: {
              currentStage: "ADMIN_REVIEW",
              classReviewed: true,
              classReviewedBy: user.id,
              classReviewedAt: new Date(),
            },
          });

          // Update report cards with teacher comment
          if (teacherComment) {
            await tx.reportCard.updateMany({
              where: { examId, classId },
              data: {
                teacherComment,
                status: "PENDING_REVIEW",
              },
            });
          }
        });

        return NextResponse.json({ 
          message: "Report cards submitted for admin review",
        });

      case "approve":
        // Admin approves report cards
        if (user.role !== "admin") {
          return NextResponse.json(
            { error: "Only admins can approve report cards" },
            { status: 403 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // Update workflow
          await tx.reportWorkflow.update({
            where: {
              examId_classId: {
                examId,
                classId,
              },
            },
            data: {
              adminApproved: true,
              adminApprovedBy: user.id,
              adminApprovedAt: new Date(),
            },
          });

          // Update report cards
          await tx.reportCard.updateMany({
            where: { examId, classId },
            data: {
              status: "APPROVED",
              approvedBy: user.id,
              approvedAt: new Date(),
              ...(principalComment && { principalComment }),
            },
          });
        });

        return NextResponse.json({ 
          message: "Report cards approved successfully",
        });

      case "publish":
        // Admin publishes report cards
        if (user.role !== "admin") {
          return NextResponse.json(
            { error: "Only admins can publish report cards" },
            { status: 403 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // Update workflow
          await tx.reportWorkflow.update({
            where: {
              examId_classId: {
                examId,
                classId,
              },
            },
            data: {
              published: true,
              publishedAt: new Date(),
            },
          });

          // Update report cards
          await tx.reportCard.updateMany({
            where: { examId, classId },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
            },
          });
        });

        return NextResponse.json({ 
          message: "Report cards published successfully",
        });

      case "reject":
        // Admin rejects report cards
        if (user.role !== "admin") {
          return NextResponse.json(
            { error: "Only admins can reject report cards" },
            { status: 403 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // Update workflow
          await tx.reportWorkflow.update({
            where: {
              examId_classId: {
                examId,
                classId,
              },
            },
            data: {
              currentStage: "CLASS_REVIEW",
              adminApproved: false,
              adminApprovedBy: null,
              adminApprovedAt: null,
            },
          });

          // Update report cards
          await tx.reportCard.updateMany({
            where: { examId, classId },
            data: {
              status: "REJECTED",
            },
          });
        });

        return NextResponse.json({ 
          message: "Report cards rejected and sent back for review",
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}
