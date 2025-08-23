import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

type StudentList = Student & { class: Class & { grade: { level: number } } };

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Building the query
  const query: Prisma.StudentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { surname: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
            ];
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [{ name: "asc" }, { surname: "asc" }],
    }),
    prisma.student.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg m-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-3 rounded-lg">
            <Image src="/student.png" alt="Students" width={24} height={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Students</h1>
            <p className="text-gray-600">Manage student records</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-600">{count}</div>
          <div className="text-sm text-gray-500">Total Students</div>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
        <TableSearch />
        {(role === "admin" || role === "teacher") && (
          <FormContainer table="student" type="create" />
        )}
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((student) => (
          <div
            key={student.id}
            className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            {/* Student Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
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
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
              </div>
              {(role === "admin" || role === "teacher") && (
                <div className="flex space-x-2">
                  <FormContainer table="student" type="update" data={student} />
                  {role === "admin" && (
                    <FormContainer
                      table="student"
                      type="delete"
                      id={student.id}
                    />
                  )}
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

              <div className="flex items-center space-x-2">
                <Image src="/phone.png" alt="Phone" width={16} height={16} />
                <span className="text-sm text-gray-600">
                  {student.phone || "N/A"}
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
                  {student.birthday
                    ? student.birthday.toLocaleDateString()
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Image
                  src="/blood.png"
                  alt="Blood Type"
                  width={16}
                  height={16}
                />
                <span className="text-sm text-gray-600">
                  Blood: {student.bloodType || "N/A"}
                </span>
              </div>

              {student.address && (
                <div className="flex items-start space-x-2">
                  <Image
                    src="/home.png"
                    alt="Address"
                    width={16}
                    height={16}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-600">
                    {student.address}
                  </span>
                </div>
              )}
            </div>

            {/* Status & Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Gender:</span>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {student.sex || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Parent:</span>
                <span className="text-sm text-gray-700">
                  {student.parentId ? "Connected" : "No parent"}
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <Link
                href={`/list/students/${student.id}`}
                className="text-green-600 text-sm font-medium hover:text-green-800"
              >
                View Details →
              </Link>
              <div className="text-xs text-gray-500">
                ID: {student.id.slice(0, 8)}...
              </div>
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
            No students match your current search criteria
          </p>
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="student" type="create" />
          )}
        </div>
      )}

      {/* Pagination */}
      {data.length > 0 && (
        <div className="mt-8">
          <Pagination page={p} count={count} />
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
