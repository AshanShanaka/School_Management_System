import ExamSchedule from "@/components/ExamSchedule";
import { getExams } from "@/lib/api";

export default async function ExamSchedulePage() {
  const exams = await getExams();

  return (
    <div className="container mx-auto py-8">
      <ExamSchedule
        schoolName="Royal College, Colombo"
        examTitle="G.C.E. O/L 2nd Term Test - 2025"
        grade="11 A"
        exams={exams}
      />
    </div>
  );
}
