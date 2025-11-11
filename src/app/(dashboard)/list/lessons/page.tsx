import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";

type LessonList = Lesson & { 
  subject: { name: string } 
} & {
  class: {
    name: string;
    grade: {
      level: number;
    };
  };
} & {
  teacher: { name: string; surname: string };
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  const columns = [
    {
      header: "Lesson Info",
      accessor: "info",
    },
    {
      header: "Subject",
      accessor: "subject",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Schedule",
      accessor: "schedule",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden lg:table-cell",
    },
    {
      header: "Timetable",
      accessor: "timetable",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: LessonList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">
            Lesson ID: {item.id}
          </p>
        </div>
      </td>
      <td>
        <div className="flex flex-col">
          <span className="font-medium">{item.subject.name}</span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {item.class.name}
        </span>
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-col">
          <span className="font-medium">{item.day}</span>
          <span className="text-xs text-gray-500">
            {item.startTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })} - {item.endTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-green-800">
              {item.teacher.name.charAt(0)}{item.teacher.surname.charAt(0)}
            </span>
          </div>
          <span className="text-sm">{item.teacher.name} {item.teacher.surname}</span>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" ||
            (role === "teacher" && item.teacherId === user?.id)) && (
            <>
              <FormContainer table="lesson" type="update" data={item} />
              <FormContainer table="lesson" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.LessonWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "search":
            query.OR = [
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        class: {
          select: {
            name: true,
            grade: { select: { level: true } },
          },
        },
        teacher: { select: { name: true, surname: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.lesson.count({ where: query }),
  ]);

  // Group lessons by class and date for better organization
  const groupedData = data.reduce((groups: { [key: string]: { [dateKey: string]: LessonList[] } }, lesson) => {
    const classKey = lesson.class.name;
    const dateKey = lesson.day; // Using day as the date key
    
    if (!groups[classKey]) {
      groups[classKey] = {};
    }
    if (!groups[classKey][dateKey]) {
      groups[classKey][dateKey] = [];
    }
    groups[classKey][dateKey].push(lesson);
    return groups;
  }, {});

  const renderLessonsByClass = () => {
    if (data.length <= 30) {
      // For smaller datasets, show regular table
      return <Table columns={columns} renderRow={renderRow} data={data} />;
    }

    // For larger datasets, show grouped view by class and date
    return (
      <div className="space-y-8">
        {Object.entries(groupedData).map(([classKey, dateGroups]) => (
          <div key={classKey} className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900 text-lg flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-700 font-bold">{classKey.split('-')[0]}</span>
                  </div>
                  Class {classKey}
                </span>
                <span className="text-sm font-normal text-gray-600 bg-white px-3 py-1 rounded-full">
                  {Object.values(dateGroups).flat().length} lessons
                </span>
              </h3>
            </div>
            
            <div className="p-4">
              <div className="grid gap-4">
                {Object.entries(dateGroups).map(([dateKey, lessons]) => (
                  <div key={`${classKey}-${dateKey}`} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-semibold text-gray-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {dateKey}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {lessons.length} periods
                        </span>
                      </h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lessons
                          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                          .map(lesson => (
                          <div key={lesson.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 mb-1">{lesson.name}</h5>
                                <p className="text-sm text-blue-600 font-medium">{lesson.subject.name}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span>
                                  {lesson.startTime.toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  })} - {lesson.endTime.toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                <span>{lesson.teacher.name} {lesson.teacher.surname}</span>
                              </div>
                            </div>
                            
                            {(role === "admin" || (role === "teacher" && lesson.teacherId === user?.id)) && (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                                <FormContainer table="lesson" type="update" data={lesson} />
                                <FormContainer table="lesson" type="delete" id={lesson.id} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Lessons ({count})</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="lesson" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 my-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter by:</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="">All Classes</option>
            {/* Add class options dynamically */}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="">All Days</option>
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="">All Teachers</option>
            {/* Add teacher options dynamically */}
          </select>
        </div>
        {count > 50 && (
          <div className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
            📊 Grouped by Class ({Object.keys(groupedData).length} classes)
          </div>
        )}
        {count > 100 && (
          <div className="ml-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
            ⚠️ Large dataset - Use filters to narrow results
          </div>
        )}
      </div>

      {/* LIST */}
      {renderLessonsByClass()}
      
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;
