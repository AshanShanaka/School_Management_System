-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('POYA_DAY', 'PUBLIC_HOLIDAY', 'SCHOOL_EVENT', 'EXAMINATION', 'VACATION', 'SPORTS_DAY', 'CULTURAL_EVENT', 'TEACHER_TRAINING', 'PARENT_MEETING');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TIMETABLE_CREATED', 'TIMETABLE_UPDATED', 'TIMETABLE_DELETED', 'HOLIDAY_ADDED', 'SCHEDULE_CONFLICT', 'GENERAL_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "TimetableVersion" (
    "id" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "description" TEXT,
    "academicYear" TEXT NOT NULL,
    "term" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "jsonData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "TimetableVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAvailability" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "Day" NOT NULL,
    "availablePeriods" JSONB NOT NULL,
    "maxPeriodsPerDay" INTEGER NOT NULL DEFAULT 6,
    "maxPeriodsPerWeek" INTEGER NOT NULL DEFAULT 30,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "HolidayType" NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classId" INTEGER,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "classId" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "TimetableNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableAnalytics" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" TEXT,
    "teacherWorkload" JSONB NOT NULL,
    "subjectDistribution" JSONB NOT NULL,
    "utilizationRate" JSONB NOT NULL,
    "conflicts" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableVersion_classId_academicYear_term_idx" ON "TimetableVersion"("classId", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAvailability_teacherId_dayOfWeek_key" ON "TeacherAvailability"("teacherId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TimetableAnalytics_academicYear_term_idx" ON "TimetableAnalytics"("academicYear", "term");

-- AddForeignKey
ALTER TABLE "TimetableVersion" ADD CONSTRAINT "TimetableVersion_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableNotification" ADD CONSTRAINT "TimetableNotification_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
