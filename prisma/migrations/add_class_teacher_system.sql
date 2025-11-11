-- Migration: Add Class Teacher System
-- Date: 2025-11-08
-- Description: Implements 1-to-1 Class Teacher assignment with parent communication features

-- Add classTeacherId to Class table (unique constraint for 1-to-1)
ALTER TABLE "Class" ADD COLUMN "classTeacherId" TEXT UNIQUE;

-- Add assignedClassId to Teacher table (unique constraint for 1-to-1)
ALTER TABLE "Teacher" ADD COLUMN "assignedClassId" INTEGER UNIQUE;

-- Add foreign key constraints
ALTER TABLE "Class" ADD CONSTRAINT "Class_classTeacherId_fkey" 
  FOREIGN KEY ("classTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_assignedClassId_fkey" 
  FOREIGN KEY ("assignedClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Class Teacher Assignment History table
CREATE TABLE "ClassTeacherAssignment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" TEXT NOT NULL,
  "classId" INTEGER NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removedAt" TIMESTAMP(3),
  "assignedBy" TEXT,
  "reason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ClassTeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE,
  CONSTRAINT "ClassTeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
);

CREATE INDEX "ClassTeacherAssignment_teacherId_idx" ON "ClassTeacherAssignment"("teacherId");
CREATE INDEX "ClassTeacherAssignment_classId_idx" ON "ClassTeacherAssignment"("classId");
CREATE INDEX "ClassTeacherAssignment_isActive_idx" ON "ClassTeacherAssignment"("isActive");

-- Create Parent Meeting table
CREATE TABLE "ParentMeeting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER NOT NULL DEFAULT 30,
  "location" TEXT,
  "meetingType" TEXT NOT NULL DEFAULT 'IN_PERSON',
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ParentMeeting_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE,
  CONSTRAINT "ParentMeeting_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE,
  CONSTRAINT "ParentMeeting_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE,
  CONSTRAINT "ParentMeeting_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
);

CREATE INDEX "ParentMeeting_teacherId_idx" ON "ParentMeeting"("teacherId");
CREATE INDEX "ParentMeeting_parentId_idx" ON "ParentMeeting"("parentId");
CREATE INDEX "ParentMeeting_studentId_idx" ON "ParentMeeting"("studentId");
CREATE INDEX "ParentMeeting_scheduledDate_idx" ON "ParentMeeting"("scheduledDate");
CREATE INDEX "ParentMeeting_status_idx" ON "ParentMeeting"("status");

-- Create Class Announcement table
CREATE TABLE "ClassAnnouncement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "teacherId" TEXT NOT NULL,
  "classId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "targetAudience" TEXT NOT NULL DEFAULT 'PARENTS',
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ClassAnnouncement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE,
  CONSTRAINT "ClassAnnouncement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
);

CREATE INDEX "ClassAnnouncement_teacherId_idx" ON "ClassAnnouncement"("teacherId");
CREATE INDEX "ClassAnnouncement_classId_idx" ON "ClassAnnouncement"("classId");
CREATE INDEX "ClassAnnouncement_isPublished_idx" ON "ClassAnnouncement"("isPublished");

-- Create Class Teacher-Parent Message table
CREATE TABLE "ClassTeacherMessage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "classId" INTEGER NOT NULL,
  "studentId" TEXT,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ClassTeacherMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Teacher"("id") ON DELETE CASCADE,
  CONSTRAINT "ClassTeacherMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Parent"("id") ON DELETE CASCADE,
  CONSTRAINT "ClassTeacherMessage_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE,
  CONSTRAINT "ClassTeacherMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
);

CREATE INDEX "ClassTeacherMessage_senderId_idx" ON "ClassTeacherMessage"("senderId");
CREATE INDEX "ClassTeacherMessage_receiverId_idx" ON "ClassTeacherMessage"("receiverId");
CREATE INDEX "ClassTeacherMessage_classId_idx" ON "ClassTeacherMessage"("classId");
CREATE INDEX "ClassTeacherMessage_isRead_idx" ON "ClassTeacherMessage"("isRead");
CREATE INDEX "ClassTeacherMessage_createdAt_idx" ON "ClassTeacherMessage"("createdAt");

-- Add comments for documentation
COMMENT ON COLUMN "Class"."classTeacherId" IS 'Unique Class Teacher for this class (1-to-1 relationship)';
COMMENT ON COLUMN "Teacher"."assignedClassId" IS 'Class where this teacher is the Class Teacher (1-to-1 relationship)';
COMMENT ON TABLE "ClassTeacherAssignment" IS 'History of class teacher assignments';
COMMENT ON TABLE "ParentMeeting" IS 'Scheduled meetings between class teacher and parents';
COMMENT ON TABLE "ClassAnnouncement" IS 'Announcements created by class teachers for their class';
COMMENT ON TABLE "ClassTeacherMessage" IS 'Direct messages between class teachers and parents';
