import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportCardGeneratorClient from "@/components/ReportCardGeneratorClient";

const ReportCardsPage = async () => {
  const user = await getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    redirect("/sign-in");
  }

  let classes = [];
  let exams = [];

  if (user.role === "teacher") {
    // Get teacher's classes
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      include: {
        classes: {
          include: {
            grade: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    if (teacher) {
      classes = teacher.classes;

      // Get exams for teacher's grade levels
      const gradeIds = classes.map((cls) => cls.gradeId);
      exams = await prisma.exam.findMany({
        where: {
          gradeId: {
            in: gradeIds,
          },
          status: {
            in: ["READY_TO_PUBLISH", "PUBLISHED"],
          },
        },
        include: {
          grade: true,
          examType: true,
        },
        orderBy: [
          { year: "desc" },
          { term: "desc" },
          { createdAt: "desc" },
        ],
      });
    }
  } else {
    // Admin can see all classes and exams
    classes = await prisma.class.findMany({
      include: {
        grade: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    exams = await prisma.exam.findMany({
      where: {
        status: {
          in: ["READY_TO_PUBLISH", "PUBLISHED"],
        },
      },
      include: {
        grade: true,
        examType: true,
      },
      orderBy: [
        { year: "desc" },
        { term: "desc" },
        { createdAt: "desc" },
      ],
    });
  }

  const serializedClasses = JSON.parse(JSON.stringify(classes));
  const serializedExams = JSON.parse(JSON.stringify(exams));

  // Determine if user is a class teacher (has only one class)
  const isClassTeacher = user.role === "teacher" && classes.length === 1;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Report Cards</h1>
          <p className="text-gray-600 mt-1">
            {isClassTeacher 
              ? "Select an exam to generate comprehensive report cards for your class"
              : "Select an exam and class to generate comprehensive report cards for all students"
            }
          </p>
        </div>
      </div>

      <ReportCardGeneratorClient
        classes={serializedClasses}
        exams={serializedExams}
        userRole={user.role}
      />
    </div>
  );
};

export default ReportCardsPage;
