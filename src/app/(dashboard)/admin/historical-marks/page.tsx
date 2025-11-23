import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HistoricalMarksPage() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    redirect('/sign-in');
  }

  // Get all students in Grade 9, 10, and 11
  const students = await prisma.student.findMany({
    where: {
      grade: {
        level: {
          in: [9, 10, 11],
        },
      },
    },
    include: {
      class: {
        include: {
          grade: true,
        },
      },
    },
    orderBy: [{ gradeId: 'asc' }, { name: 'asc' }],
  });

  // Get all subjects
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });

  // Get existing exams for historical marks
  const historicalExams = await prisma.exam.findMany({
    where: {
      OR: [
        { title: { contains: 'Historical', mode: 'insensitive' } },
        { title: { contains: 'Previous', mode: 'insensitive' } },
        { title: { contains: 'Grade 9', mode: 'insensitive' } },
        { title: { contains: 'Grade 10', mode: 'insensitive' } },
      ],
    },
    include: {
      grade: true,
      examSubjects: {
        include: {
          subject: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Historical Marks Entry</h1>
            <p className="text-gray-600 mt-2">
              Add previous grade marks (Grade 9/10) for students to enable O/L predictions.
              Students need at least 9 historical marks per subject.
            </p>
          </div>
          <a
            href="/admin/historical-marks-import"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>📥</span>
            Import via Excel
          </a>
        </div>
      </header>

      {/* Instructions */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          📋 How to Add Historical Marks
        </h2>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>Step 1:</strong> Create historical exam entries for previous
            terms (e.g., "Grade 9 - Term 1", "Grade 10 - Term 3")
          </li>
          <li>
            <strong>Step 2:</strong> Add subjects to each historical exam
          </li>
          <li>
            <strong>Step 3:</strong> Enter marks for students in those exams
          </li>
          <li>
            <strong>Step 4:</strong> Students will need 9+ marks per subject for
            O/L predictions to work
          </li>
        </ol>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">{students.length}</p>
          <p className="text-xs text-gray-500 mt-1">Grade 9, 10, 11</p>
        </article>

        <article className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Available Subjects</h3>
          <p className="text-3xl font-bold text-green-600">{subjects.length}</p>
          <p className="text-xs text-gray-500 mt-1">All subjects</p>
        </article>

        <article className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Historical Exams</h3>
          <p className="text-3xl font-bold text-purple-600">
            {historicalExams.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Previous records</p>
        </article>
      </section>

      {/* Action Buttons */}
      <section className="flex flex-wrap gap-4">
        <a
          href="/admin/create-historical-exam"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Create Historical Exam
        </a>
        
        <a
          href="/list/exams"
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          View All Exams
        </a>

        <a
          href="/teacher/marks-entry"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Enter Marks
        </a>
      </section>

      {/* Existing Historical Exams */}
      {historicalExams.length > 0 && (
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <header className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Existing Historical Exams</h2>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Exam Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historicalExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {exam.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{exam.term}</td>
                    <td className="px-6 py-4 text-gray-700">
                      Grade {exam.grade.level}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {exam.examSubjects.length} subjects
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`/teacher/marks-entry?examId=${exam.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Enter Marks
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Students by Grade */}
      <section className="bg-white rounded-lg shadow overflow-hidden">
        <header className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Students Requiring Historical Data</h2>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[9, 10, 11].map((gradeLevel) => {
              const gradeStudents = students.filter(
                (s) => s.class.grade.level === gradeLevel
              );
              return (
                <div key={gradeLevel} className="space-y-3">
                  <h3 className="font-semibold text-lg">
                    Grade {gradeLevel} ({gradeStudents.length} students)
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {gradeStudents.map((student) => (
                      <div
                        key={student.id}
                        className="bg-gray-50 rounded p-3 text-sm"
                      >
                        <p className="font-medium">
                          {student.name} {student.surname}
                        </p>
                        <p className="text-xs text-gray-600">{student.class.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-amber-900 mb-3">
          💡 Tips for Historical Marks Entry
        </h2>
        <ul className="space-y-2 text-sm text-amber-800">
          <li>
            • <strong>Use descriptive names:</strong> "Grade 9 - Term 1 2023",
            "Grade 10 - Annual Exam 2024"
          </li>
          <li>
            • <strong>Match subjects:</strong> Ensure historical exams include the
            same subjects students are studying now
          </li>
          <li>
            • <strong>Consistent grading:</strong> Use marks out of 100 for all
            historical entries
          </li>
          <li>
            • <strong>Minimum 9 entries:</strong> Each student needs at least 9
            exam marks per subject for predictions
          </li>
          <li>
            • <strong>Bulk entry:</strong> You can create one historical exam and
            enter marks for all students at once
          </li>
        </ul>
      </section>
    </div>
  );
}
