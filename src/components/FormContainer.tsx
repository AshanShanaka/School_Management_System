import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { getCurrentUser } from "@/lib/auth";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "grade"
    | "timetable";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const user = await getCurrentUser();
  const role = user?.role;
  const currentUserId = user?.id;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
        });
        const studentClasses = await prisma.class.findMany({
          include: { _count: { select: { students: true } } },
        });
        const studentParents = await prisma.parent.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = {
          classes: studentClasses,
          grades: studentGrades,
          parents: studentParents,
        };
        break;
      case "exam":
        const examSubjects = await prisma.subject.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        });
        const examTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = {
          subjects: examSubjects,
          teachers: examTeachers,
        };
        break;
      case "assignment":
        const assignmentLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: { id: true, name: true },
        });
        relatedData = { lessons: assignmentLessons };
        break;
      case "lesson":
        const lessonSubjects = await prisma.subject.findMany({
          select: {
            id: true,
            name: true,
            teachers: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });
        const lessonClasses = await prisma.class.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        relatedData = {
          subjects: lessonSubjects,
          classes: lessonClasses,
        };
        break;
      case "timetable":
        const timetableClasses = await prisma.class.findMany({
          include: {
            grade: true,
          },
          orderBy: [{ gradeId: "asc" }, { name: "asc" }],
        });
        relatedData = { classes: timetableClasses };
        break;
      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
