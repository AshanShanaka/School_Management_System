"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface Grade {
  id: number;
  level: number;
}

interface Subject {
  id: number;
  name: string;
  code?: string;
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
}

interface Class {
  id: number;
  name: string;
  gradeId: number;
}

interface SubjectSchedule {
  subjectId: number;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
}

interface ClassSupervisor {
  classId: number;
  className: string;
  supervisorIds: string[];
}

interface ExamFormData {
  title: string;
  year: string;
  term: string;
  examTypeEnum: string;
  gradeId: string;
  overallStartDate: string;
  overallEndDate: string;
  status: string;
}

const CreateExamPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  const [formData, setFormData] = useState<ExamFormData>({
    title: "",
    year: new Date().getFullYear().toString(),
    term: "1",
    examTypeEnum: "UNIT",
    gradeId: "",
    overallStartDate: "",
    overallEndDate: "",
    status: "DRAFT"
  });

  const [subjectSchedules, setSubjectSchedules] = useState<SubjectSchedule[]>([]);
  const [classSupervisors, setClassSupervisors] = useState<ClassSupervisor[]>([]);

  useEffect(() => {
    fetchGrades();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (formData.gradeId) {
      fetchSubjectsForGrade(parseInt(formData.gradeId));
      fetchClassesForGrade(parseInt(formData.gradeId));
    }
  }, [formData.gradeId]);

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades");
      if (response.ok) {
        const data = await response.json();
        const gradesArray = data.grades || data;
        setGrades(Array.isArray(gradesArray) ? gradesArray : []);
      }
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    }
  };

  const fetchSubjectsForGrade = async (gradeId: number) => {
    try {
      const response = await fetch(`/api/subjects?gradeId=${gradeId}`);
      if (response.ok) {
        const data = await response.json();
        const subjectsArray = Array.isArray(data) ? data : [];
        setSubjects(subjectsArray);
        
        // Initialize subject schedules
        const schedules = subjectsArray.map(subject => ({
          subjectId: subject.id,
          subjectName: subject.name,
          examDate: "",
          startTime: "",
          endTime: ""
        }));
        setSubjectSchedules(schedules);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchClassesForGrade = async (gradeId: number) => {
    try {
      const response = await fetch(`/api/classes?gradeId=${gradeId}`);
      if (response.ok) {
        const data = await response.json();
        const classesArray = Array.isArray(data) ? data : [];
        setClasses(classesArray);
        
        // Initialize class supervisors
        const supervisors = classesArray.map(cls => ({
          classId: cls.id,
          className: cls.name,
          supervisorIds: []
        }));
        setClassSupervisors(supervisors);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  const updateSubjectSchedule = (index: number, field: keyof SubjectSchedule, value: string) => {
    const updated = [...subjectSchedules];
    updated[index] = { ...updated[index], [field]: value };
    setSubjectSchedules(updated);
  };

  const updateClassSupervisor = (classIndex: number, supervisorIds: string[]) => {
    const updated = [...classSupervisors];
    updated[classIndex] = { ...updated[classIndex], supervisorIds };
    setClassSupervisors(updated);
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      toast.error("Exam title is required");
      return false;
    }
    if (!formData.gradeId) {
      toast.error("Grade selection is required");
      return false;
    }
    if (!formData.overallStartDate || !formData.overallEndDate) {
      toast.error("Overall exam start and end dates are required");
      return false;
    }
    
    // Check if exam already exists
    const existingExam = grades.find(g => g.id === parseInt(formData.gradeId));
    if (!existingExam) {
      toast.error("Selected grade is invalid");
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    for (let i = 0; i < subjectSchedules.length; i++) {
      const schedule = subjectSchedules[i];
      if (!schedule.examDate || !schedule.startTime || !schedule.endTime) {
        toast.error(`Please complete schedule for ${schedule.subjectName}`);
        return false;
      }
      
      // Validate date is within overall exam period
      if (schedule.examDate < formData.overallStartDate || schedule.examDate > formData.overallEndDate) {
        toast.error(`${schedule.subjectName} exam date must be within overall exam period`);
        return false;
      }
      
      // Validate start time is before end time
      if (schedule.startTime >= schedule.endTime) {
        toast.error(`${schedule.subjectName} start time must be before end time`);
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    for (let i = 0; i < classSupervisors.length; i++) {
      const supervisor = classSupervisors[i];
      if (supervisor.supervisorIds.length === 0) {
        toast.error(`Please assign at least one supervisor for ${supervisor.className}`);
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    setLoading(true);

    try {
      const examData = {
        ...formData,
        gradeId: parseInt(formData.gradeId),
        year: parseInt(formData.year),
        term: parseInt(formData.term),
        subjectSchedules,
        classSupervisors
      };

      const response = await fetch("/api/exams/comprehensive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(examData),
      });

      if (response.ok) {
        toast.success("🎉 Exam created successfully!");
        router.push("/list/exams");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create exam");
      }
    } catch (error) {
      toast.error("Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  const bulkSetTime = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      toast.error("Please provide both start and end times");
      return;
    }
    
    const updated = subjectSchedules.map(schedule => ({
      ...schedule,
      startTime,
      endTime
    }));
    setSubjectSchedules(updated);
    toast.success("Time applied to all subjects");
  };

  const bulkSetDate = (date: string) => {
    if (!date) {
      toast.error("Please provide a date");
      return;
    }
    
    const updated = subjectSchedules.map(schedule => ({
      ...schedule,
      examDate: date
    }));
    setSubjectSchedules(updated);
    toast.success("Date applied to all subjects");
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Image src="/arrow-left.png" alt="Back" width={16} height={16} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
        </div>
        <div className="text-sm text-gray-500">
          Step {currentStep} of 3
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
            Basic Info
          </span>
          <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
            Subject Schedule
          </span>
          <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
            Supervisors
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">📋 Basic Exam Information</h2>
              <p className="text-blue-600 text-sm">Enter the fundamental details for your exam</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Grade 11 Term 1 Examination 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade *
                </label>
                <select
                  value={formData.gradeId}
                  onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      Grade {grade.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term *
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type *
                </label>
                <select
                  value={formData.examTypeEnum}
                  onChange={(e) => setFormData({ ...formData, examTypeEnum: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="UNIT">Unit Test</option>
                  <option value="TERM1">Term 1</option>
                  <option value="TERM2">Term 2</option>
                  <option value="TERM3">Term 3</option>
                  <option value="TRIAL_OL">Trial O/L</option>
                  <option value="NATIONAL_OL">National O/L</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Start Date *
                </label>
                <input
                  type="date"
                  value={formData.overallStartDate}
                  onChange={(e) => setFormData({ ...formData, overallStartDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall End Date *
                </label>
                <input
                  type="date"
                  value={formData.overallEndDate}
                  onChange={(e) => setFormData({ ...formData, overallEndDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={formData.overallStartDate}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SUBJECT SCHEDULE */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">📅 Subject Schedule</h2>
              <p className="text-green-600 text-sm">Set exam dates and times for each subject</p>
            </div>

            {/* BULK ACTIONS */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">⚡ Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <input
                    type="date"
                    placeholder="Date"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onChange={(e) => e.target.value && bulkSetDate(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[type="date"]') as HTMLInputElement;
                      if (input?.value) bulkSetDate(input.value);
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                  >
                    Apply to All
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    id="bulk-start-time"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="time"
                    id="bulk-end-time"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const startInput = document.getElementById('bulk-start-time') as HTMLInputElement;
                      const endInput = document.getElementById('bulk-end-time') as HTMLInputElement;
                      if (startInput?.value && endInput?.value) {
                        bulkSetTime(startInput.value, endInput.value);
                      }
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                  >
                    Apply Time
                  </button>
                </div>
              </div>
            </div>

            {/* SUBJECT SCHEDULES */}
            <div className="space-y-4">
              {subjectSchedules.map((schedule, index) => (
                <div key={schedule.subjectId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium">
                        {schedule.subjectName}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Date *
                      </label>
                      <input
                        type="date"
                        value={schedule.examDate}
                        onChange={(e) => updateSubjectSchedule(index, "examDate", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={formData.overallStartDate}
                        max={formData.overallEndDate}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => updateSubjectSchedule(index, "startTime", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => updateSubjectSchedule(index, "endTime", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: CLASS SUPERVISORS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-purple-800 mb-2">👥 Exam Supervisors</h2>
              <p className="text-purple-600 text-sm">Assign supervisors (invigilators) for each class</p>
            </div>

            <div className="space-y-4">
              {classSupervisors.map((supervisor, index) => (
                <div key={supervisor.classId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium">
                        {supervisor.className}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supervisors * (Select multiple)
                      </label>
                      <select
                        multiple
                        value={supervisor.supervisorIds}
                        onChange={(e) => {
                          const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                          updateClassSupervisor(index, selectedValues);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                        required
                      >
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} {teacher.surname}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Hold Ctrl/Cmd to select multiple supervisors
                      </p>
                    </div>
                  </div>

                  {/* Display selected supervisors */}
                  {supervisor.supervisorIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Supervisors:</p>
                      <div className="flex flex-wrap gap-2">
                        {supervisor.supervisorIds.map((teacherId) => {
                          const teacher = teachers.find(t => t.id === teacherId);
                          return teacher ? (
                            <span
                              key={teacherId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {teacher.name} {teacher.surname}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = supervisor.supervisorIds.filter(id => id !== teacherId);
                                  updateClassSupervisor(index, updated);
                                }}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of 3
          </div>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Exam...
                </>
              ) : (
                <>
                  <Image src="/create.png" alt="" width={16} height={16} />
                  Create Exam
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateExamPage;
