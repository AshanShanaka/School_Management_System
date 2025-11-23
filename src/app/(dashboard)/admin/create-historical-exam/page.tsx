import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreateHistoricalExamForm from './CreateHistoricalExamForm';

export default async function CreateHistoricalExamPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/sign-in');
  }

  // Get all grades
  const grades = await prisma.grade.findMany({
    orderBy: { level: 'asc' },
  });

  // Get all subjects
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Create Historical Exam</h1>
        <p className="text-gray-600 mt-2">
          Create an exam entry for previous grade marks (e.g., Grade 9 Term 1, Grade 10 Annual)
        </p>
      </header>

      <CreateHistoricalExamForm grades={grades} subjects={subjects} />
    </div>
  );
}
