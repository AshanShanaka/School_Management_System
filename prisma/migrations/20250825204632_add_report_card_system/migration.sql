-- CreateEnum
CREATE TYPE "public"."ReportCardStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."ReportCard" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "public"."ReportCardStatus" NOT NULL DEFAULT 'DRAFT',
    "totalMarks" INTEGER,
    "maxMarks" INTEGER,
    "percentage" DOUBLE PRECISION,
    "overallGrade" TEXT,
    "classRank" INTEGER,
    "classAverage" DOUBLE PRECISION,
    "teacherComment" TEXT,
    "principalComment" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportCardSubject" (
    "id" SERIAL NOT NULL,
    "reportCardId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "classAverage" DOUBLE PRECISION,
    "remarks" TEXT,

    CONSTRAINT "ReportCardSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportWorkflow" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "currentStage" "public"."WorkflowStage" NOT NULL DEFAULT 'MARKS_ENTRY',
    "marksComplete" BOOLEAN NOT NULL DEFAULT false,
    "classReviewed" BOOLEAN NOT NULL DEFAULT false,
    "classReviewedBy" TEXT,
    "classReviewedAt" TIMESTAMP(3),
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminApprovedBy" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeScale" (
    "id" SERIAL NOT NULL,
    "gradeId" INTEGER NOT NULL,
    "minPercent" DOUBLE PRECISION NOT NULL,
    "maxPercent" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "points" DOUBLE PRECISION,
    "description" TEXT,

    CONSTRAINT "GradeScale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_examId_classId_studentId_key" ON "public"."ReportCard"("examId", "classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCardSubject_reportCardId_subjectId_key" ON "public"."ReportCardSubject"("reportCardId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportWorkflow_examId_classId_key" ON "public"."ReportWorkflow"("examId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_gradeId_grade_key" ON "public"."GradeScale"("gradeId", "grade");

-- AddForeignKey
ALTER TABLE "public"."ReportCard" ADD CONSTRAINT "ReportCard_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportCard" ADD CONSTRAINT "ReportCard_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportCard" ADD CONSTRAINT "ReportCard_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportCardSubject" ADD CONSTRAINT "ReportCardSubject_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "public"."ReportCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportCardSubject" ADD CONSTRAINT "ReportCardSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportWorkflow" ADD CONSTRAINT "ReportWorkflow_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportWorkflow" ADD CONSTRAINT "ReportWorkflow_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportWorkflow" ADD CONSTRAINT "ReportWorkflow_classReviewedBy_fkey" FOREIGN KEY ("classReviewedBy") REFERENCES "public"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportWorkflow" ADD CONSTRAINT "ReportWorkflow_adminApprovedBy_fkey" FOREIGN KEY ("adminApprovedBy") REFERENCES "public"."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeScale" ADD CONSTRAINT "GradeScale_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
