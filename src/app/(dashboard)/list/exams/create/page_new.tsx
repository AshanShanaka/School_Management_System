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

const CreateExamPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear().toString(),
    gradeId: "",
    term: "1",
    examType: "TERM1",
    status: "DRAFT",
    subjects: [] as any[],
    supervisors: [] as any[]
  });

  const examTypeOptions = [
    { value: "UNIT", label: "Unit Test" },
    { value: "TERM1", label: "Term 1" },
    { value: "TERM2", label: "Term 2" },
    { value: "TERM3", label: "Term 3" },
    { value: "TRIAL_OL", label: "Trial O/L" },
    { value: "NATIONAL_OL", label: "National O/L" }
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    fetchGrades();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (formData.gradeId) {
      fetchSubjects();
      fetchClasses();
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
      console.error("Error fetching grades:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`/api/subjects?gradeId=${formData.gradeId}`);
      if (response.ok) {
        const data = await response.json();
        const subjectsArray = Array.isArray(data) ? data : [];
        setSubjects(subjectsArray);
        
        // Initialize subjects with empty schedule
        const subjectsWithSchedule = subjectsArray.map((subject: any) => ({
          ...subject,
          examDate: "",
          startTime: "",
          endTime: ""
        }));
        setFormData(prev => ({ ...prev, subjects: subjectsWithSchedule }));
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`/api/classes?gradeId=${formData.gradeId}`);
      if (response.ok) {
        const data = await response.json();
        const classesArray = Array.isArray(data) ? data : [];
        setClasses(classesArray);
        
        // Initialize supervisors for each class
        const classesWithSupervisors = classesArray.map((classItem: any) => ({
          classId: classItem.id,
          className: classItem.name,
          teacherIds: []
        }));
        setFormData(prev => ({ ...prev, supervisors: classesWithSupervisors }));
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teachers");
      if (response.ok) {
        const data = await response.json();
        const teachersArray = Array.isArray(data) ? data : [];
        setTeachers(teachersArray);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectScheduleChange = (subjectId: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(subject =>
        subject.id === subjectId ? { ...subject, [field]: value } : subject
      )
    }));
  };

  const handleSupervisorChange = (classId: number, teacherIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      supervisors: prev.supervisors.map(supervisor =>
        supervisor.classId === classId ? { ...supervisor, teacherIds } : supervisor
      )
    }));
  };

  const validateStep1 = () => {
    return formData.name && formData.year && formData.gradeId && formData.term && formData.examType;
  };

  const validateStep2 = () => {
    return formData.subjects.every(subject => 
      subject.examDate && subject.startTime && subject.endTime
    );
  };

  const validateStep3 = () => {
    return formData.supervisors.every(supervisor => 
      supervisor.teacherIds.length > 0
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else {
      toast.error("Please fill all required fields");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("Exam created successfully!");
        router.push("/list/exams");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create exam");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${
            step === currentStep ? 'bg-blue-600 text-white border-blue-600' :
            step < currentStep ? 'bg-green-600 text-white border-green-600' : 
            'bg-white text-gray-400 border-gray-300'
          }`}>
            {step < currentStep ? (
              <Image src="/update.png" alt="completed" width={16} height={16} className="filter invert" />
            ) : step}
          </div>
          {step < 3 && (
            <div className={`w-20 h-1 ${step < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">📋 Exam Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Grade 11 Term 1 Examination"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.year}
            onChange={(e) => handleInputChange("year", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.gradeId}
            onChange={(e) => handleInputChange("gradeId", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Grade</option>
            {grades.map(grade => (
              <option key={grade.id} value={grade.id}>Grade {grade.level}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.term}
            onChange={(e) => handleInputChange("term", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.examType}
            onChange={(e) => handleInputChange("examType", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {examTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange("status", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">📅 Subject Schedule</h2>
      
      <div className="space-y-4">
        {formData.subjects.map((subject, index) => (
          <div key={subject.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div>
                <h3 className="font-medium text-gray-800">{subject.name}</h3>
                <p className="text-sm text-gray-500">Subject Code: {subject.code || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={subject.examDate}
                  onChange={(e) => handleSubjectScheduleChange(subject.id, "examDate", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={subject.startTime}
                  onChange={(e) => handleSubjectScheduleChange(subject.id, "startTime", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={subject.endTime}
                  onChange={(e) => handleSubjectScheduleChange(subject.id, "endTime", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {formData.subjects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Please select a grade first to see subjects</p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">👥 Exam Supervisors (Invigilators)</h2>
      
      <div className="space-y-6">
        {formData.supervisors.map((supervisor, index) => (
          <div key={supervisor.classId} className="p-4 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <h3 className="font-medium text-gray-800">Class: {supervisor.className}</h3>
              <p className="text-sm text-gray-500">Assign supervisors for the entire exam session</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Teachers <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {teachers.map(teacher => (
                  <label key={teacher.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={supervisor.teacherIds.includes(teacher.id)}
                      onChange={(e) => {
                        const newTeacherIds = e.target.checked
                          ? [...supervisor.teacherIds, teacher.id]
                          : supervisor.teacherIds.filter((id: string) => id !== teacher.id);
                        handleSupervisorChange(supervisor.classId, newTeacherIds);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{teacher.name} {teacher.surname}</span>
                  </label>
                ))}
              </div>
              
              {supervisor.teacherIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-green-600">
                    ✓ {supervisor.teacherIds.length} supervisor(s) assigned
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {formData.supervisors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Please select a grade first to see classes</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Exam</h1>
          <p className="text-gray-600">Set up a comprehensive exam with schedules and supervisors</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of 3</span>
            <span>
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Subject Schedule"}
              {currentStep === 3 && "Exam Supervisors"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Steps */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Image src="/sort.png" alt="previous" width={16} height={16} className="mr-2 rotate-180" />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              Next
              <Image src="/sort.png" alt="next" width={16} height={16} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Image src="/create.png" alt="create" width={16} height={16} className="mr-2 filter invert" />
                  Create Exam
                </>
              )}
            </button>
          )}
        </div>

        {/* Summary Card */}
        {currentStep === 3 && (
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-4">📊 Exam Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Exam:</span>
                <p className="text-gray-800">{formData.name}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Year/Term:</span>
                <p className="text-gray-800">{formData.year} / Term {formData.term}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Subjects:</span>
                <p className="text-gray-800">{formData.subjects.length} subjects</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Classes:</span>
                <p className="text-gray-800">{formData.supervisors.length} classes</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateExamPage;
