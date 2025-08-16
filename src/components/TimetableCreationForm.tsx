"use client";

import { TIMETABLE_CONFIG } from "@/lib/timetableConfig";
import Link from "next/link";
import { useState } from "react";

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
}

interface SubjectAssignment {
  id: number;
  subjectId: number;
  teacherId: string;
  subject: Subject;
  teacher: Teacher;
}

interface TimetableCreationFormProps {
  selectedClass: {
    id: number;
    name: string;
    grade: { level: number };
  };
  subjectAssignments: SubjectAssignment[];
}

const TimetableCreationForm = ({
  selectedClass,
  subjectAssignments,
}: TimetableCreationFormProps) => {
  // Get unique subjects from assignments
  const subjects = Array.from(
    new Map(
      subjectAssignments.map((assignment) => [
        assignment.subject.id,
        assignment.subject,
      ])
    ).values()
  );

  // State to track selected subjects for each slot
  const [selectedSubjects, setSelectedSubjects] = useState<{
    [key: string]: number | null;
  }>({});

  // Function to get teachers for a specific subject
  const getTeachersForSubject = (subjectId: number | null): Teacher[] => {
    if (!subjectId) return [];
    return subjectAssignments
      .filter((assignment) => assignment.subjectId === subjectId)
      .map((assignment) => assignment.teacher);
  };

  // Function to handle subject selection change
  const handleSubjectChange = (slotKey: string, subjectId: string) => {
    const newSelectedSubjects = { ...selectedSubjects };
    newSelectedSubjects[slotKey] = subjectId ? parseInt(subjectId) : null;
    setSelectedSubjects(newSelectedSubjects);
  };

  return (
    <div className="bg-white p-6 rounded-md">
      <h2 className="text-xl font-semibold mb-4">
        Step 2: Create Timetable for Grade {selectedClass.grade.level} -{" "}
        {selectedClass.name}
      </h2>

      <form
        action="/api/admin/timetable/create"
        method="POST"
        className="space-y-6"
      >
        <input type="hidden" name="classId" value={selectedClass.id} />

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timetable Name
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder={`Grade ${selectedClass.grade.level}-${selectedClass.name} Timetable`}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaPurple focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year
            </label>
            <input
              type="text"
              name="academicYear"
              required
              placeholder="2024-2025"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-lamaPurple focus:border-transparent"
            />
          </div>
        </div>

        {/* Subject Assignments Info */}
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Available Subject-Teacher Assignments for this Class:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {subjectAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white p-2 rounded border">
                <span className="font-medium">{assignment.subject.name}</span>
                <span className="text-gray-600">
                  {" "}
                  - {assignment.teacher.name} {assignment.teacher.surname}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">
            Step 3: Assign Subjects and Teachers
          </h3>
          <div className="min-w-[800px]">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left font-semibold">
                    Time
                  </th>
                  {TIMETABLE_CONFIG.days.map((day) => (
                    <th
                      key={day}
                      className="border border-gray-300 p-3 text-center font-semibold"
                    >
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMETABLE_CONFIG.timeSlots.map((slot) => (
                  <tr
                    key={slot.period}
                    className={slot.isBreak ? "bg-yellow-50" : ""}
                  >
                    <td className="border border-gray-300 p-3 font-medium text-sm">
                      <div>
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.isBreak ? "Break Time" : `Period ${slot.period}`}
                      </div>
                    </td>
                    {TIMETABLE_CONFIG.days.map((day) => {
                      const slotKey = `${day}_${slot.period}`;
                      const selectedSubjectId = selectedSubjects[slotKey];
                      const availableTeachers =
                        getTeachersForSubject(selectedSubjectId);

                      return (
                        <td key={day} className="border border-gray-300 p-2">
                          {slot.isBreak ? (
                            <div className="text-center text-yellow-800 font-medium bg-yellow-100 p-2 rounded">
                              Break Time
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Subject Dropdown */}
                              <select
                                name={`slot_${day}_${slot.period}_subject`}
                                className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-lamaPurple"
                                onChange={(e) =>
                                  handleSubjectChange(slotKey, e.target.value)
                                }
                                value={selectedSubjectId || ""}
                              >
                                <option value="">No Subject</option>
                                {subjects.map((subject) => (
                                  <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                  </option>
                                ))}
                              </select>

                              {/* Teacher Dropdown - Filtered based on selected subject */}
                              <select
                                name={`slot_${day}_${slot.period}_teacher`}
                                className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-lamaPurple"
                                disabled={!selectedSubjectId}
                              >
                                <option value="">
                                  {selectedSubjectId
                                    ? "Select Teacher"
                                    : "Select Subject First"}
                                </option>
                                {availableTeachers.map((teacher) => (
                                  <option key={teacher.id} value={teacher.id}>
                                    {teacher.name} {teacher.surname}
                                  </option>
                                ))}
                              </select>

                              {/* Helper text */}
                              {selectedSubjectId &&
                                availableTeachers.length === 0 && (
                                  <div className="text-xs text-red-500">
                                    No teachers assigned to this subject
                                  </div>
                                )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/list/timetables">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="px-6 py-3 bg-lamaPurple text-white rounded-md hover:bg-lamaPurpleLight"
          >
            Create Timetable
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimetableCreationForm;
