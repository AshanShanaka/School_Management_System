import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TimetableCreationForm from "@/components/TimetableCreationForm";

const AdminTimetableCreatePage = async ({
  searchParams,
}: {
  searchParams: { classId?: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return notFound();
  }

  // Get all classes for selection
  const classes = await prisma.class.findMany({
    include: {
      grade: true,
      _count: {
        select: { students: true },
      },
    },
    orderBy: [{ gradeId: "asc" }, { name: "asc" }],
  });

  // Get subjects and subject assignments for the selected class
  let subjectAssignments: Array<{
    id: number;
    subjectId: number;
    teacherId: string;
    subject: { id: number; name: string };
    teacher: { id: string; name: string; surname: string };
  }> = [];
  let selectedClass = null;

  if (searchParams.classId) {
    selectedClass = await prisma.class.findUnique({
      where: { id: parseInt(searchParams.classId) },
      include: { grade: true },
    });

    // Get subject assignments for this specific class
    subjectAssignments = await prisma.subjectAssignment.findMany({
      where: { classId: parseInt(searchParams.classId) },
      include: {
        subject: true,
        teacher: true,
      },
      orderBy: [{ subject: { name: "asc" } }, { teacher: { name: "asc" } }],
    });
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create Timetable</h1>
            <p className="text-gray-500">
              Create and manage class timetables for the academic year
            </p>
          </div>
          <Link href="/list/timetables">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
              View All Timetables
            </button>
          </Link>
        </div>
      </div>

      {/* CLASS SELECTION */}
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Step 1: Select Class</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classItem) => (
            <Link
              key={classItem.id}
              href={`?classId=${classItem.id}`}
              className={`border-2 p-4 rounded-md transition-all hover:shadow-md ${
                selectedClass?.id === classItem.id
                  ? "border-lamaPurple bg-lamaPurpleLight"
                  : "border-gray-200 hover:border-lamaPurple"
              }`}
            >
              <div className="flex items-center gap-3">
                <Image src="/class.png" alt="" width={24} height={24} />
                <div>
                  <h3 className="font-semibold">
                    Grade {classItem.grade.level} - {classItem.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {classItem._count.students} students
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* TIMETABLE CREATION FORM */}
      {selectedClass && subjectAssignments.length > 0 && (
        <TimetableCreationForm
          selectedClass={selectedClass}
          subjectAssignments={subjectAssignments}
        />
      )}

      {/* NO SUBJECT ASSIGNMENTS MESSAGE */}
      {selectedClass && subjectAssignments.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-md">
          <div className="flex items-center gap-3">
            <Image src="/class.png" alt="" width={24} height={24} />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                No Subject Assignments Found
              </h3>
              <p className="text-yellow-700 mt-1">
                Before creating a timetable for Grade{" "}
                {selectedClass.grade.level} - {selectedClass.name}, you need to
                assign subjects and teachers to this class.
              </p>
              <Link
                href="/list/subjects"
                className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Manage Subject Assignments
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimetableCreatePage;
