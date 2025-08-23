/*
  Warnings:

  - You are about to drop the column `lessonId` on the `TimetableSlot` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examTypeId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SpecialDayType" AS ENUM ('POYA_DAY', 'PUBLIC_HOLIDAY', 'SCHOOL_EVENT', 'EXAMINATION', 'VACATION', 'SPORTS_DAY', 'CULTURAL_EVENT');

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentId_fkey";

-- DropForeignKey
ALTER TABLE "TimetableSlot" DROP CONSTRAINT "TimetableSlot_lessonId_fkey";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "surname" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "day" "Day",
ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "examTypeId" INTEGER NOT NULL,
ADD COLUMN     "lessonId" INTEGER,
ADD COLUMN     "subjectCode" TEXT,
ADD COLUMN     "subjectId" INTEGER,
ADD COLUMN     "supervisor" TEXT,
ADD COLUMN     "teacherId" TEXT,
ADD COLUMN     "venue" TEXT;

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "code" TEXT,
ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TimetableSlot" DROP COLUMN "lessonId",
ADD COLUMN     "subjectId" INTEGER,
ADD COLUMN     "teacherId" TEXT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialDay" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SpecialDayType" NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classId" INTEGER,

    CONSTRAINT "SpecialDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAssignment" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ExamType_name_key" ON "ExamType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAssignment_subjectId_teacherId_classId_key" ON "SubjectAssignment"("subjectId", "teacherId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialDay" ADD CONSTRAINT "SpecialDay_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
