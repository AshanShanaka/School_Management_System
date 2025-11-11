/*
  Warnings:

  - A unique constraint covering the columns `[year,term,gradeId,examTypeEnum]` on the table `Exam` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_examTypeId_fkey";

-- DropIndex
DROP INDEX "Exam_year_term_gradeId_examTypeId_key";

-- AlterTable
ALTER TABLE "Exam" ALTER COLUMN "examTypeId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Exam_year_term_gradeId_examTypeEnum_key" ON "Exam"("year", "term", "gradeId", "examTypeEnum");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
