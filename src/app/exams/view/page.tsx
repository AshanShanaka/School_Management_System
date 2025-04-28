import { getExams } from "@/lib/api";
import { Exam } from "@prisma/client";

interface ExamWithRelations extends Exam {
  lesson?: {
    subject?: {
      name: string;
    };
    teacher?: {
      name: string;
      surname: string;
    };
  };
}

export default async function ViewExamsPage() {
  const exams = (await getExams()) as ExamWithRelations[];

  // Group exams by their title (exam type and year)
  const groupedExams = exams.reduce(
    (acc: Record<string, ExamWithRelations[]>, exam: ExamWithRelations) => {
      const key = exam.title;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(exam);
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto p-6">
      {Object.entries(groupedExams).map(([title, examGroup]) => (
        <div key={title} className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Royal College, Colombo</h1>
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <h3 className="text-lg">Grade: 11 A</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Day</th>
                  <th className="border p-2">Time</th>
                  <th className="border p-2">Subject</th>
                  <th className="border p-2">Venue</th>
                  <th className="border p-2">Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {examGroup.map((exam: ExamWithRelations) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {new Date(exam.startTime).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="border p-2">
                      {new Date(exam.startTime).toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </td>
                    <td className="border p-2">
                      {new Date(exam.startTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      -{" "}
                      {new Date(exam.endTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="border p-2">
                      {exam.lesson?.subject?.name || "Not assigned"}
                    </td>
                    <td className="border p-2">{exam.venue || "Main Hall"}</td>
                    <td className="border p-2">
                      {exam.lesson?.teacher?.name
                        ? `${exam.lesson.teacher.name} ${exam.lesson.teacher.surname}`
                        : "To be announced"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Instructions: Arrive 15 minutes before start time. No mobile
              phones allowed.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
