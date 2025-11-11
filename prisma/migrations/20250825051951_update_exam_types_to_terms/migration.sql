/*
  Warnings:

  - The values [TERM] on the enum `ExamTypeEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExamTypeEnum_new" AS ENUM ('UNIT', 'TERM1', 'TERM2', 'TERM3', 'TRIAL_OL', 'NATIONAL_OL');
ALTER TABLE "Exam" ALTER COLUMN "examTypeEnum" TYPE "ExamTypeEnum_new" USING ("examTypeEnum"::text::"ExamTypeEnum_new");
ALTER TYPE "ExamTypeEnum" RENAME TO "ExamTypeEnum_old";
ALTER TYPE "ExamTypeEnum_new" RENAME TO "ExamTypeEnum";
DROP TYPE "ExamTypeEnum_old";
COMMIT;
