// Complete rebuild with role-based access control
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student, Parent } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

type StudentList = Student & {
  class: Class & { grade: { level: number } };
  parent: Parent;
};

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();

  // Role-based access control
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">
            Access Denied
          </h1>
          <p className="text-red-500">Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  // Check role permissions
  if (!["admin", "teacher", "parent", "student"].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-yellow-600 mb-2">
            Access Restricted
          </h1>
          <p className="text-yellow-500">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Build role-specific query
  const query: Prisma.StudentWhereInput = {};

  // Add search functionality
  if (queryParams.search) {
    query.OR = [
      { name: { contains: queryParams.search, mode: "insensitive" } },
      { surname: { contains: queryParams.search, mode: "insensitive" } },
      { email: { contains: queryParams.search, mode: "insensitive" } },
    ];
  }

  // Role-based filtering
  switch (user.role) {
    case "admin":
      // Admin can see all students - no additional filtering
      break;
    case "teacher":
      // Teacher can see students in their classes
      const teacherClasses = await prisma.class.findMany({
        where: { supervisorId: user.id },
        select: { id: true },
      });
      if (teacherClasses.length > 0) {
        query.classId = { in: teacherClasses.map((c) => c.id) };
      } else {
        // If teacher has no classes, show no students
        query.id = "impossible-id";
      }
      break;
    case "parent":
      // Parent can see only their children
      query.parentId = user.id;
      break;
    case "student":
      // Student can see only themselves and classmates
      const currentStudent = await prisma.student.findUnique({
        where: { id: user.id },
        select: { classId: true },
      });
      if (currentStudent) {
        query.classId = currentStudent.classId;
      } else {
        query.id = "impossible-id";
      }
      break;
  }

  try {
    const [data, count] = await prisma.$transaction([
      prisma.student.findMany({
        where: query,
        include: {
          class: {
            include: {
              grade: true,
            },
          },
          parent: true,
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
        orderBy: [
          { class: { name: "asc" } },
          { name: "asc" },
          { surname: "asc" },
        ],
      }),
      prisma.student.count({ where: query }),
    ]);

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg m-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Image src="/student.png" alt="Students" width={24} height={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Students</h1>
              <p className="text-gray-600">
                {user.role === "admin" && "Manage all students"}
                {user.role === "teacher" && "Your class students"}
                {user.role === "parent" && "Your children"}
                {user.role === "student" && "Your classmates"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{count}</div>
            <div className="text-sm text-gray-500">
              {count === 1 ? "Student" : "Students"}
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
          <TableSearch />
          {user.role === "admin" && (
            <FormContainer table="student" type="create" />
          )}
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((student) => (
            <div
              key={student.id}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100"
            >
              {/* Student Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Image
                      src={student.img || "/noAvatar.png"}
                      alt={student.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {student.name} {student.surname}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {student.email || "No email"}
                    </p>
                  </div>
                </div>
                {user.role === "admin" && (
                  <div className="flex space-x-2">
                    <FormContainer
                      table="student"
                      type="update"
                      data={student}
                    />
                    <FormContainer
                      table="student"
                      type="delete"
                      id={student.id}
                    />
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Image src="/class.png" alt="Class" width={16} height={16} />
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      {student.class.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      Grade {student.class.grade.level}
                    </span>
                  </div>
                </div>

                {student.phone && (
                  <div className="flex items-center space-x-2">
                    <Image
                      src="/phone.png"
                      alt="Phone"
                      width={16}
                      height={16}
                    />
                    <span className="text-sm text-gray-600">
                      {student.phone}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Image
                    src="/parent.png"
                    alt="Parent"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm text-gray-600">
                    {student.parent.name} {student.parent.surname}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Image
                    src="/calendar.png"
                    alt="Birthday"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm text-gray-600">
                    {student.birthday.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Image
                    src="/maleFemale.png"
                    alt="Gender"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm text-gray-600 capitalize">
                    {student.sex.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <Link
                  href={`/list/students/${student.id}`}
                  className="text-blue-600 text-sm font-medium hover:text-blue-800"
                >
                  View Details →
                </Link>
                <span className="text-xs text-gray-500">
                  ID: {student.id.slice(-6)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {data.length === 0 && (
          <div className="text-center py-12">
            <Image
              src="/student.png"
              alt="No students"
              width={64}
              height={64}
              className="mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No students found
            </h3>
            <p className="text-gray-600 mb-4">
              {queryParams.search
                ? "No students match your search criteria"
                : user.role === "admin"
                ? "No students in the system"
                : user.role === "teacher"
                ? "No students assigned to your classes"
                : user.role === "parent"
                ? "No children found in your account"
                : "No classmates found"}
            </p>
            {user.role === "admin" && (
              <FormContainer table="student" type="create" />
            )}
          </div>
        )}

        {/* Pagination */}
        {count > ITEM_PER_PAGE && (
          <div className="mt-8">
            <Pagination page={p} count={count} />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error fetching students:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-red-500">Failed to load students data.</p>
        </div>
      </div>
    );
  }
};

export default StudentListPage;
