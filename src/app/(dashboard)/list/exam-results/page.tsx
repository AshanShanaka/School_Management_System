import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

type ExamResultList = {
  id: number;
  examTitle: string;
  studentName: string;
  studentSurname: string;
  subjectName: string;
  marks: number;
  grade: string | null;
  className: string;
  examDate: Date;
};

const ExamResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;
  const currentUserId = user?.id;

  // Redirect admin to class-wise exam results view
  if (role === "admin") {
    const queryString = new URLSearchParams(searchParams as Record<string, string>).toString();
    redirect(`/admin/exam-results${queryString ? `?${queryString}` : ""}`);
  }

  const columns = [
    {
      header: "Exam",
      accessor: "exam",
    },
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Subject",
      accessor: "subject",
      className: "hidden md:table-cell",
    },
    {
      header: "Marks",
      accessor: "marks",
      className: "hidden md:table-cell",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden lg:table-cell",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden lg:table-cell",
    },
  ];

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "text-gray-600";
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper === "A") return "text-green-600 font-bold";
    if (gradeUpper === "B") return "text-blue-600 font-semibold";
    if (gradeUpper === "C") return "text-yellow-600 font-semibold";
    if (gradeUpper === "S") return "text-orange-600";
    if (gradeUpper === "W") return "text-red-600";
    return "text-gray-600";
  };

  const renderRow = (item: ExamResultList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <span className="font-semibold">{item.examTitle}</span>
        </div>
      </td>
      <td>
        <span className="font-medium">
          {item.studentName} {item.studentSurname}
        </span>
      </td>
      <td className="hidden md:table-cell">{item.subjectName}</td>
      <td className="hidden md:table-cell">
        <span className="font-bold text-gray-900">{item.marks}</span>
      </td>
      <td className="hidden md:table-cell">
        <span className={getGradeColor(item.grade)}>
          {item.grade || "-"}
        </span>
      </td>
      <td className="hidden lg:table-cell">{item.className}</td>
      <td className="hidden lg:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.examDate)}
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.ExamResultWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "examId":
            query.examId = parseInt(value);
            break;
          case "studentId":
            query.studentId = value;
            break;
          case "subjectId":
            query.examSubject = {
              subjectId: parseInt(value),
            };
            break;
          case "search":
            query.OR = [
              { exam: { title: { contains: value, mode: "insensitive" } } },
              { student: { name: { contains: value, mode: "insensitive" } } },
              { student: { surname: { contains: value, mode: "insensitive" } } },
              { examSubject: { subject: { name: { contains: value, mode: "insensitive" } } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      break;
    case "teacher":
      // Teachers can see results for exams they are teaching
      query.examSubject = {
        teacherId: currentUserId!,
      };
      break;
    case "student":
      query.studentId = currentUserId!;
      break;
    case "parent":
      query.student = {
        parentId: currentUserId!,
      };
      break;
    default:
      break;
  }

  const [dataRes, count] = await prisma.$transaction([
    prisma.examResult.findMany({
      where: query,
      include: {
        student: {
          select: {
            name: true,
            surname: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        exam: {
          select: {
            title: true,
            createdAt: true,
          },
        },
        examSubject: {
          select: {
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.examResult.count({ where: query }),
  ]);

  const data = dataRes.map((item) => ({
    id: item.id,
    examTitle: item.exam.title,
    studentName: item.student.name,
    studentSurname: item.student.surname,
    subjectName: item.examSubject.subject.name,
    marks: item.marks,
    grade: item.grade,
    className: item.student.class?.name || "N/A",
    examDate: item.exam.createdAt,
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold">Exam Results</h1>
          <p className="text-sm text-gray-600 mt-1">
            All examination results (not assignment results)
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Results</p>
              <p className="text-2xl font-bold text-blue-900">{count}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Image src="/exam.png" alt="" width={24} height={24} className="filter invert" />
            </div>
          </div>
        </div>

        {queryParams.examId && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold">Filtered Exam</p>
                <Link
                  href={`/list/exams/${queryParams.examId}`}
                  className="text-sm text-purple-900 hover:underline font-medium"
                >
                  View Exam Details →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Quick Actions</p>
              <Link
                href="/list/exams"
                className="text-sm text-green-900 hover:underline font-medium"
              >
                View All Exams →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      {data.length > 0 ? (
        <>
          <Table columns={columns} renderRow={renderRow} data={data} />
          {/* PAGINATION */}
          <Pagination page={p} count={count} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <Image src="/exam.png" alt="No results" width={64} height={64} className="opacity-50 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Exam Results Found</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            {queryParams.examId
              ? "No results have been entered for this exam yet. Teachers can start entering marks through the exam workflow."
              : "There are no exam results in the system yet. Results will appear here once teachers enter marks for exams."}
          </p>
          {(role === "admin" || role === "teacher") && (
            <Link
              href="/list/exams"
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Exams
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamResultListPage;
