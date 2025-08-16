/*
  Warnings:

  - You are about to drop the column `day` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `examTypeId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `subjectCode` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the `ExamType` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `birthday` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bloodType` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `Parent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_examTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentId_fkey";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "day",
DROP COLUMN "duration",
DROP COLUMN "examTypeId",
DROP COLUMN "lessonId",
DROP COLUMN "subjectCode",
DROP COLUMN "subjectId",
DROP COLUMN "supervisor",
DROP COLUMN "teacherId",
DROP COLUMN "venue";

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "birthday" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "bloodType" TEXT NOT NULL,
ADD COLUMN     "img" TEXT,
ADD COLUMN     "sex" "UserSex" NOT NULL;

-- DropTable
DROP TABLE "ExamType";

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
