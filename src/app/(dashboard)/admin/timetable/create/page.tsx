import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TimetableWrapper from "@/components/TimetableWrapper";
import BatchTimetableGenerator from "@/components/BatchTimetableGenerator";

const AdminTimetableCreatePage = async ({
  searchParams,
}: {
  searchParams: { classId?: string; mode?: string };
}) => {
  const user = await getCurrentUser();
  const role = user?.role;

  if (role !== "admin") {
    return notFound();
  }

  const mode = searchParams.mode || 'single'; // 'single' or 'batch'

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

  // Get subjects for the selected class
  let subjects: Array<{
    id: number;
    name: string;
    code: string | null;
    teachers: Array<{
      id: string;
      name: string;
      surname: string;
    }>;
  }> = [];
  let selectedClass: {
    id: number;
    name: string;
    capacity: number;
    grade: {
      id: number;
      level: number;
    };
  } | null = null;

  if (searchParams.classId) {
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(searchParams.classId) },
      include: { 
        grade: {
          select: {
            id: true,
            level: true
          }
        }
      },
    });

    if (classData) {
      selectedClass = {
        id: classData.id,
        name: classData.name,
        capacity: classData.capacity,
        grade: {
          id: classData.grade.id,
          level: classData.grade.level
        }
      };
    }

    // Get all subjects with their teachers
    const subjectsData = await prisma.subject.findMany({
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });

    subjects = subjectsData.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      teachers: subject.teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        surname: teacher.surname
      }))
    }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 p-6">
      {/* Professional Header */}
      <div className="bg-white rounded-xl shadow-sm border border-violet-200 p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/timetable"
              className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
            >
              <Image src="/arrow-left.png" alt="Back" width={20} height={20} />
            </Link>
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-3">
              <Image src="/calendar.png" alt="" width={32} height={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🤖 AI Timetable Generator</h1>
              <p className="text-gray-600 mt-1">Generate optimal timetables automatically in seconds</p>
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-3">
            <Link href="/admin/timetable">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2">
                <Image src="/view.png" alt="View" width={18} height={18} />
                View All Timetables
              </button>
            </Link>
            <div className="bg-violet-100 rounded-lg p-1 flex gap-1">
              <Link 
                href="?mode=single"
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  mode === 'single' 
                    ? 'bg-violet-600 text-white shadow-sm' 
                    : 'text-violet-700 hover:bg-violet-200'
                }`}
              >
                Single Class
              </Link>
              <Link 
                href="?mode=batch"
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  mode === 'batch' 
                    ? 'bg-violet-600 text-white shadow-sm' 
                    : 'text-violet-700 hover:bg-violet-200'
                }`}
              >
                Batch Mode
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Mode */}
      {mode === 'batch' && (
        <BatchTimetableGenerator classes={classes} />
      )}

      {/* Single Mode */}
      {mode === 'single' && (
        <>
          {/* Class Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-violet-100 rounded-lg p-3">
                <Image src="/class.png" alt="Classes" width={24} height={24} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Step 1: Select Class</h2>
                <p className="text-gray-600">Choose a class for AI-powered timetable generation</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`?mode=single&classId=${classItem.id}`}
                  className="group"
                >
                  <div className={`border-2 p-6 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${
                    selectedClass?.id === classItem.id
                      ? "border-violet-500 bg-violet-50 shadow-lg scale-105"
                      : "border-gray-200 hover:border-violet-300 bg-white"
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        selectedClass?.id === classItem.id 
                          ? "bg-violet-500 text-white" 
                          : "bg-gray-100 text-gray-600 group-hover:bg-violet-100"
                      }`}>
                        <Image src="/class.png" alt="" width={24} height={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg ${
                          selectedClass?.id === classItem.id ? "text-violet-700" : "text-gray-800"
                        }`}>
                          {classItem.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {classItem._count.students} students
                        </p>
                      </div>
                    </div>
                    {selectedClass?.id === classItem.id && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-violet-500 text-white rounded-full p-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Timetable Generation */}
          {selectedClass && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 rounded-lg p-3">
                  <Image src="/calendar.png" alt="Timetable" width={24} height={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">Step 2: Generate Timetable</h2>
                  <p className="text-gray-600">
                    AI will create optimal timetable for {selectedClass.name}
                  </p>
                </div>
              </div>
              
              <TimetableWrapper
                selectedClass={selectedClass}
                subjects={subjects}
              />
            </div>
          )}
          
          {/* Instructions Panel */}
          {!selectedClass && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="bg-gradient-to-r from-violet-100 to-purple-100 rounded-2xl p-8 mb-8">
                  <div className="bg-white rounded-xl p-6 inline-block shadow-sm">
                    <Image src="/calendar.png" alt="Timetable" width={64} height={64} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mt-6">🤖 AI-Powered Timetable Creation</h3>
                  <p className="text-gray-600 mt-2">Select a class above and let AI generate the perfect timetable</p>
                </div>

                {/* Quick Guide */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Why Use AI Generation?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-3xl mb-2">⚡</div>
                      <h5 className="font-bold text-gray-800 mb-1">Lightning Fast</h5>
                      <p className="text-sm text-gray-600">Complete timetable in 2 seconds vs 30 minutes manually</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-3xl mb-2">🎯</div>
                      <h5 className="font-bold text-gray-800 mb-1">Conflict-Free</h5>
                      <p className="text-sm text-gray-600">Automatically prevents teacher double-booking</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-3xl mb-2">✨</div>
                      <h5 className="font-bold text-gray-800 mb-1">Optimized</h5>
                      <p className="text-sm text-gray-600">Balanced subject distribution across the week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminTimetableCreatePage;
