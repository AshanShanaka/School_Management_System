-- AlterTable
ALTER TABLE "ExamSubject" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "examDate" TIMESTAMP(3),
ADD COLUMN     "startTime" TEXT;

-- CreateTable
CREATE TABLE "ExamSupervisor" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSupervisor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamSupervisor_examId_classId_teacherId_key" ON "ExamSupervisor"("examId", "classId", "teacherId");

-- AddForeignKey
ALTER TABLE "ExamSupervisor" ADD CONSTRAINT "ExamSupervisor_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSupervisor" ADD CONSTRAINT "ExamSupervisor_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSupervisor" ADD CONSTRAINT "ExamSupervisor_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
