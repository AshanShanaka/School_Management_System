/*
  Warnings:

  - You are about to drop the `WeeklyTimetable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeeklyTimetableSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WeeklyTimetable" DROP CONSTRAINT "WeeklyTimetable_classId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklyTimetableSlot" DROP CONSTRAINT "WeeklyTimetableSlot_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklyTimetableSlot" DROP CONSTRAINT "WeeklyTimetableSlot_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklyTimetableSlot" DROP CONSTRAINT "WeeklyTimetableSlot_weeklyTimetableId_fkey";

-- DropTable
DROP TABLE "WeeklyTimetable";

-- DropTable
DROP TABLE "WeeklyTimetableSlot";

-- CreateTable
CREATE TABLE "SubjectAllocation" (
    "id" SERIAL NOT NULL,
    "periodsPerWeek" INTEGER NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAllocation_gradeId_classId_subjectId_key" ON "SubjectAllocation"("gradeId", "classId", "subjectId");

-- AddForeignKey
ALTER TABLE "SubjectAllocation" ADD CONSTRAINT "SubjectAllocation_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAllocation" ADD CONSTRAINT "SubjectAllocation_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAllocation" ADD CONSTRAINT "SubjectAllocation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
