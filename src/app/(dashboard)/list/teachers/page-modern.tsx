import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Building the query
  const query: Prisma.TeacherWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classes = {
              some: {
                id: parseInt(value),
              },
            };
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
    prisma.teacher.findMany({
      where: query,
      include: {
        subjects: true,
        classes: { include: { grade: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [{ name: "asc" }, { surname: "asc" }],
    }),
    prisma.teacher.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg m-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Image src="/teacher.png" alt="Teachers" width={24} height={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
            <p className="text-gray-600">Manage teaching staff</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{count}</div>
          <div className="text-sm text-gray-500">Total Teachers</div>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
        <TableSearch />
        {role === "admin" && <FormContainer table="teacher" type="create" />}
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            {/* Teacher Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Image
                    src={teacher.img || "/noAvatar.png"}
                    alt={teacher.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {teacher.name} {teacher.surname}
                  </h3>
                  <p className="text-sm text-gray-600">{teacher.email}</p>
                </div>
              </div>
              {role === "admin" && (
                <div className="flex space-x-2">
                  <FormContainer table="teacher" type="update" data={teacher} />
                  <FormContainer
                    table="teacher"
                    type="delete"
                    id={teacher.id}
                  />
                </div>
              )}
            </div>

            {/* Teacher Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Image src="/phone.png" alt="Phone" width={16} height={16} />
                <span className="text-sm text-gray-600">
                  {teacher.phone || "N/A"}
                </span>
              </div>

              <div className="flex items-start space-x-2">
                <Image
                  src="/subject.png"
                  alt="Subjects"
                  width={16}
                  height={16}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Subjects:</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.length > 0 ? (
                      teacher.subjects.slice(0, 3).map((subject) => (
                        <span
                          key={subject.id}
                          className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {subject.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">
                        No subjects assigned
                      </span>
                    )}
                    {teacher.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{teacher.subjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Image
                  src="/class.png"
                  alt="Classes"
                  width={16}
                  height={16}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Classes:</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.classes.length > 0 ? (
                      teacher.classes.slice(0, 2).map((cls) => (
                        <span
                          key={cls.id}
                          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                        >
                          {cls.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">
                        No classes assigned
                      </span>
                    )}
                    {teacher.classes.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{teacher.classes.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <Link
                href={`/list/teachers/${teacher.id}`}
                className="text-blue-600 text-sm font-medium hover:text-blue-800"
              >
                View Details →
              </Link>
              <div className="text-xs text-gray-500">
                ID: {teacher.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <Image
            src="/teacher.png"
            alt="No teachers"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No teachers found
          </h3>
          <p className="text-gray-600 mb-4">
            No teachers match your current search criteria
          </p>
          {role === "admin" && <FormContainer table="teacher" type="create" />}
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

export default TeacherListPage;
