import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Parent, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

type ParentList = Parent & { students: Student[] };

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Building the query
  const query: Prisma.ParentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
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
    prisma.parent.findMany({
      where: query,
      include: {
        students: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [{ name: "asc" }, { surname: "asc" }],
    }),
    prisma.parent.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg m-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Image src="/parent.png" alt="Parents" width={24} height={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Parents</h1>
            <p className="text-gray-600">Manage parent accounts</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-orange-600">{count}</div>
          <div className="text-sm text-gray-500">Total Parents</div>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
        <TableSearch />
        {(role === "admin" || role === "teacher") && (
          <FormContainer table="parent" type="create" />
        )}
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((parent) => (
          <div
            key={parent.id}
            className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            {/* Parent Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Image
                    src="/parent.png"
                    alt={parent.name}
                    width={24}
                    height={24}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {parent.name} {parent.surname}
                  </h3>
                  <p className="text-sm text-gray-600">{parent.email}</p>
                </div>
              </div>
              {(role === "admin" || role === "teacher") && (
                <div className="flex space-x-2">
                  <FormContainer table="parent" type="update" data={parent} />
                  {role === "admin" && (
                    <FormContainer
                      table="parent"
                      type="delete"
                      id={parent.id}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Parent Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Image src="/phone.png" alt="Phone" width={16} height={16} />
                <span className="text-sm text-gray-600">
                  {parent.phone || "N/A"}
                </span>
              </div>

              {parent.address && (
                <div className="flex items-start space-x-2">
                  <Image
                    src="/home.png"
                    alt="Address"
                    width={16}
                    height={16}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-600">
                    {parent.address}
                  </span>
                </div>
              )}

              {/* Children Section */}
              <div className="flex items-start space-x-2">
                <Image
                  src="/student.png"
                  alt="Children"
                  width={16}
                  height={16}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Children:</p>
                  <div className="space-y-1">
                    {parent.students.length > 0 ? (
                      parent.students.slice(0, 3).map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between bg-white p-2 rounded border"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {student.name} {student.surname}
                          </span>
                          <Link
                            href={`/list/students/${student.id}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View →
                          </Link>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">
                        No children assigned
                      </span>
                    )}
                    {parent.students.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{parent.students.length - 3} more children
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Total Children:</span>
                <span className="text-sm font-medium text-orange-600">
                  {parent.students.length}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Account Status:</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Active
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <Link
                href={`/list/parents/${parent.id}`}
                className="text-orange-600 text-sm font-medium hover:text-orange-800"
              >
                View Details →
              </Link>
              <div className="text-xs text-gray-500">
                ID: {parent.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <Image
            src="/parent.png"
            alt="No parents"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No parents found
          </h3>
          <p className="text-gray-600 mb-4">
            No parents match your current search criteria
          </p>
          {(role === "admin" || role === "teacher") && (
            <FormContainer table="parent" type="create" />
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

export default ParentListPage;
