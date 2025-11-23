import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Exam, Prisma, ExamType, Grade, ExamSubject, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

type ExamList = Exam & {
  grade: Grade;
  examType: ExamType;
  examSubjects: (ExamSubject & {
    subject: Subject;
    teacher: Teacher;
  })[];
  _count: {
    results: number;
  };
};

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  const columns = [
    {
      header: "Exam Title",
      accessor: "title",
    },
    {
      header: "Grade",
      accessor: "grade",
    },
    {
      header: "Type",
      accessor: "type",
      className: "hidden md:table-cell",
    },
    {
      header: "Year",
      accessor: "year",
      className: "hidden md:table-cell",
    },
    {
      header: "Term",
      accessor: "term",
      className: "hidden md:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
      className: "hidden md:table-cell",
    },
    {
      header: "Subjects",
      accessor: "subjects",
      className: "hidden lg:table-cell",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const getStatusBadgeClass = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "DRAFT":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "PUBLISHED":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "ONGOING":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "COMPLETED":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "CANCELLED":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getExamTypeBadgeClass = (examType: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (examType) {
      case "TERM_TEST":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "MONTHLY_TEST":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "UNIT_TEST":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case "FINAL_EXAM":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "TRIAL_OL":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "NATIONAL_OL":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const renderRow = (item: ExamList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-xs text-gray-500">
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </td>
      <td>Grade {item.grade.level}</td>
      <td className="hidden md:table-cell">
        <span className={getExamTypeBadgeClass(item.examTypeEnum)}>
          {item.examTypeEnum.replace('_', ' ')}
        </span>
      </td>
      <td className="hidden md:table-cell">{item.year}</td>
      <td className="hidden md:table-cell">Term {item.term}</td>
      <td className="hidden md:table-cell">
        <span className={getStatusBadgeClass(item.status)}>
          {item.status}
        </span>
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex flex-col gap-1">
          {item.examSubjects.slice(0, 2).map((examSubject, index) => (
            <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {examSubject.subject.name}
            </span>
          ))}
          {item.examSubjects.length > 2 && (
            <span className="text-xs text-gray-500">
              +{item.examSubjects.length - 2} more
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {/* View Timetable button - available for all roles */}
          <Link href={`/list/exams/timetable/${item.id}`}>
            <button 
              className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600"
              title="View Exam Timetable"
            >
              <Image src="/calendar.png" alt="View Timetable" width={16} height={16} className="filter invert" />
            </button>
          </Link>
          
          {/* Role-specific actions */}
          {role === "admin" && (
            <>
              <Link href={`/list/exams/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                  <Image src="/view.png" alt="" width={16} height={16} />
                </button>
              </Link>
              <Link href={`/list/exams/edit/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                  <Image src="/update.png" alt="" width={16} height={16} />
                </button>
              </Link>
            </>
          )}
          {role === "teacher" && (
            <>
              <Link href={`/teacher/marks-entry/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaYellow">
                  <Image src="/update.png" alt="" width={16} height={16} />
                </button>
              </Link>
              <Link href={`/teacher/exam-results/${item.id}`}>
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                  <Image src="/result.png" alt="" width={16} height={16} />
                </button>
              </Link>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build query based on search params
  const query: Prisma.ExamWhereInput = {};
  
  // IMPORTANT: Exclude historical exams (Grade 9 & 10) from exam management
  // These are only shown in "Previous Marks Records" section
  query.grade = {
    level: {
      notIn: [9, 10] // Exclude Grade 9 and 10 historical marks
    }
  };
  
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "gradeId":
            query.gradeId = parseInt(value);
            break;
          case "examTypeId":
            query.examTypeId = parseInt(value);
            break;
          case "year":
            query.year = parseInt(value);
            break;
          case "term":
            query.term = parseInt(value);
            break;
          case "status":
            query.status = value as any;
            break;
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  // Filter based on user role
  if (role === "student") {
    // Students can only see published exams for their grade
    const student = await prisma.student.findUnique({
      where: { id: user?.id },
      include: { class: { include: { grade: true } } }
    });
    if (student?.class?.gradeId) {
      query.gradeId = student.class.gradeId;
      query.status = "PUBLISHED"; // Students only see published exams
    }
  } else if (role === "parent") {
    // Parents can see published exams for their children's grades
    const parent = await prisma.parent.findUnique({
      where: { id: user?.id },
      include: {
        students: {
          include: { class: { include: { grade: true } } }
        }
      }
    });
    if (parent?.students && parent.students.length > 0) {
      const gradeIds = parent.students
        .map(student => student.class?.gradeId)
        .filter(id => id !== undefined);
      if (gradeIds.length > 0) {
        query.gradeId = { in: gradeIds };
        query.status = "PUBLISHED"; // Parents only see published exams
      }
    }
  } else if (role === "teacher") {
    // Teachers can see exams for grades they teach
    const teacher = await prisma.teacher.findUnique({
      where: { id: user?.id },
      include: {
        lessons: {
          include: {
            class: {
              include: {
                grade: true
              }
            }
          }
        }
      }
    });
    
    if (teacher?.lessons && teacher.lessons.length > 0) {
      const gradeIds = teacher.lessons
        .map(lesson => lesson.class.gradeId)
        .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
      if (gradeIds.length > 0) {
        query.gradeId = { in: gradeIds };
      }
    }
  }

  // Get total count
  const [data, count] = await prisma.$transaction([
    prisma.exam.findMany({
      where: query,
      include: {
        grade: true,
        examType: true,
        examSubjects: {
          include: {
            subject: true,
            teacher: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.exam.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Exam Management</h1>
        {role === "admin" && (
          <Link
            href="/list/exams/create"
            className="bg-skyBlue hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Image src="/create.png" alt="" width={14} height={14} />
            Create New Exam
          </Link>
        )}
      </div>

      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold">
          All Exams
        </h1>
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
      
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ExamListPage;
