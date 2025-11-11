/*
  Warnings:

  - Added the required column `updatedAt` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('MARKS_ENTRY', 'CLASS_REVIEW', 'ADMIN_REVIEW');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExamStatus" ADD VALUE 'MARKS_ENTRY';
ALTER TYPE "ExamStatus" ADD VALUE 'CLASS_REVIEW';
ALTER TYPE "ExamStatus" ADD VALUE 'READY_TO_PUBLISH';
ALTER TYPE "ExamStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "classId" INTEGER,
ADD COLUMN     "marksEntryDeadline" TIMESTAMP(3),
ADD COLUMN     "reviewDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExamSubject" ADD COLUMN     "marksEntered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marksEnteredAt" TIMESTAMP(3),
ADD COLUMN     "marksEnteredBy" TEXT;

-- AlterTable
ALTER TABLE "GradeBand" ADD COLUMN     "examId" INTEGER;

-- CreateTable
CREATE TABLE "ExamWorkflow" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "adminId" TEXT,
    "teacherId" TEXT,
    "classId" INTEGER,
    "completedAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamWorkflow_examId_stage_classId_key" ON "ExamWorkflow"("examId", "stage", "classId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamWorkflow" ADD CONSTRAINT "ExamWorkflow_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamWorkflow" ADD CONSTRAINT "ExamWorkflow_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamWorkflow" ADD CONSTRAINT "ExamWorkflow_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamWorkflow" ADD CONSTRAINT "ExamWorkflow_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
