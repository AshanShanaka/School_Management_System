import dynamic from "next/dynamic";
import prisma from "@/lib/prisma";
import { Assignment, Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

const ClientFormModal = dynamic(() => import("@/components/FormModal"), {
  ssr: false,
});

type AssignmentList = Assignment & {
  lesson: {
    subject: Subject;
    class: Class & {
      grade: {
        level: number;
      };
    };
    teacher: Teacher;
  };
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;
  const currentUserId = user?.id;

  const { page, ...queryParams } = searchParams;

  // URL PARAMS CONDITION

  const query: Prisma.AssignmentWhereInput = {};

  query.lesson = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lesson.classId = parseInt(value);
            break;
          case "teacherId":
            query.lesson.teacherId = value;
            break;
          case "search":
            query.lesson.subject = {
              name: { contains: value, mode: "insensitive" },
            };
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
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      query.lesson.class = {
        students: {
          some: {
            parentId: currentUserId!,
          },
        },
      };
      break;
    default:
      break;
  }

  const data = await prisma.assignment.findMany({
    where: query,
    include: {
      lesson: {
        select: {
          subject: { select: { id: true, name: true } },
          teacher: { select: { name: true, surname: true } },
          class: {
            select: {
              name: true,
              grade: { select: { level: true } },
            },
          },
        },
      },
    },
    orderBy: [
      { lesson: { subject: { name: "asc" } } },
      { dueDate: "asc" }
    ],
  });

  // Group assignments by subject
  const assignmentsBySubject = data.reduce((acc, assignment) => {
    const subjectName = assignment.lesson.subject.name;
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(assignment);
    return acc;
  }, {} as Record<string, AssignmentList[]>);

  const subjects = Object.keys(assignmentsBySubject).sort();

  const getStatusBadge = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">Due Today</span>;
    } else if (diffDays <= 3) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Due Soon</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Upcoming</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-gray-600 text-sm mt-1">
            {data.length} total assignments across {subjects.length} subjects
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(role === "admin" || role === "teacher") && (
            <ClientFormModal table="assignment" type="create" />
          )}
        </div>
      </div>

      {/* SUBJECT-WISE ASSIGNMENTS */}
      {data.length === 0 ? (
        <div className="text-center py-12">
          <Image 
            src="/assignment.png" 
            alt="No assignments" 
            width={64} 
            height={64} 
            className="mx-auto opacity-50 mb-4"
          />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No Assignments Found</h3>
          <p className="text-gray-400">There are no assignments available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((subjectName) => (
            <div key={subjectName} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Subject Header */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Image src="/subject.png" alt="" width={20} height={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">{subjectName}</h2>
                      <p className="text-sm text-gray-600">
                        {assignmentsBySubject[subjectName].length} assignment{assignmentsBySubject[subjectName].length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignments List */}
              <div className="divide-y divide-gray-200">
                {assignmentsBySubject[subjectName].map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {assignment.title}
                          </h3>
                          {getStatusBadge(assignment.dueDate)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Image src="/class.png" alt="" width={16} height={16} />
                            <span className="font-medium">Class:</span>
                            <span>{assignment.lesson.class.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Image src="/teacher.png" alt="" width={16} height={16} />
                            <span className="font-medium">Teacher:</span>
                            <span>{assignment.lesson.teacher.name} {assignment.lesson.teacher.surname}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Image src="/calendar.png" alt="" width={16} height={16} />
                            <span className="font-medium">Due:</span>
                            <span className="font-semibold">
                              {new Intl.DateTimeFormat("en-US", {
                                dateStyle: "medium",
                              }).format(assignment.dueDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                          <Image src="/date.png" alt="" width={16} height={16} />
                          <span className="font-medium">Start Date:</span>
                          <span>
                            {new Intl.DateTimeFormat("en-US", {
                              dateStyle: "medium",
                            }).format(assignment.startDate)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {(role === "admin" || role === "teacher") && (
                        <div className="flex items-center gap-2">
                          <ClientFormModal table="assignment" type="update" data={assignment} />
                          <ClientFormModal table="assignment" type="delete" id={assignment.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentListPage;
