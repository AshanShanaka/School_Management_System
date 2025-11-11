-- CreateTable
CREATE TABLE "WeeklyTimetable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "WeeklyTimetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyTimetableSlot" (
    "id" SERIAL NOT NULL,
    "day" "Day" NOT NULL,
    "period" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "weeklyTimetableId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "teacherId" TEXT,

    CONSTRAINT "WeeklyTimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyTimetableSlot_weeklyTimetableId_day_period_key" ON "WeeklyTimetableSlot"("weeklyTimetableId", "day", "period");

-- AddForeignKey
ALTER TABLE "WeeklyTimetable" ADD CONSTRAINT "WeeklyTimetable_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyTimetableSlot" ADD CONSTRAINT "WeeklyTimetableSlot_weeklyTimetableId_fkey" FOREIGN KEY ("weeklyTimetableId") REFERENCES "WeeklyTimetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyTimetableSlot" ADD CONSTRAINT "WeeklyTimetableSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyTimetableSlot" ADD CONSTRAINT "WeeklyTimetableSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
