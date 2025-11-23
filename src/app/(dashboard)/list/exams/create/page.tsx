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
  const [teacherSearch, setTeacherSearch] = useState<{[key: string]: string}>({});
  
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear().toString(),
    gradeId: "",
    term: "1",
    examType: "TERM1",  // Keep for backend compatibility but hidden from user
    status: "DRAFT",
    subjects: [] as any[],
    supervisors: [] as any[]
  });

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

  // Generate suggested exam name based on selected options
  useEffect(() => {
    if (formData.gradeId && formData.term && formData.year) {
      const grade = grades.find(g => g.id.toString() === formData.gradeId);
      
      if (grade && !formData.name) {
        const suggestedName = `Grade ${grade.level} - Term ${formData.term} Exam ${formData.year}`;
        setFormData(prev => ({ ...prev, name: suggestedName }));
      }
    }
  }, [formData.gradeId, formData.term, formData.year, grades]);

  const fetchGrades = async () => {
    try {
      // Fetch all grades without pagination for dropdown
      const response = await fetch("/api/grades?page=1&all=true");
      if (response.ok) {
        const data = await response.json();
        console.log("Grades API response:", data);
        
        // Handle different response formats
        let gradesArray = [];
        if (Array.isArray(data)) {
          gradesArray = data;
        } else if (data.grades && Array.isArray(data.grades)) {
          gradesArray = data.grades;
        } else if (data.data && Array.isArray(data.data)) {
          gradesArray = data.data;
        }
        
        console.log("Processed grades array:", gradesArray);
        setGrades(gradesArray);
        
        if (gradesArray.length === 0) {
          toast.error("No grades found in the system. Please add grades first.");
        } else {
          console.log(`✅ Loaded ${gradesArray.length} grades`);
        }
      } else {
        console.error("Failed to fetch grades:", response.status);
        toast.error("Failed to load grades");
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Failed to load grades");
    }
  };

  const fetchSubjects = async () => {
    try {
      console.log("Fetching subjects for grade:", formData.gradeId);
      const response = await fetch(`/api/subjects?gradeId=${formData.gradeId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched subjects:", data);
        const subjectsArray = Array.isArray(data) ? data : [];
        setSubjects(subjectsArray);
        
        // Initialize subjects with empty schedule (no teacher assignment needed)
        const subjectsWithSchedule = subjectsArray.map((subject: any) => ({
          ...subject,
          examDate: "",
          startTime: "",
          endTime: ""
        }));
        setFormData(prev => ({ ...prev, subjects: subjectsWithSchedule }));
        console.log("Initialized subjects with schedule:", subjectsWithSchedule);
      } else {
        console.error("Failed to fetch subjects:", response.status);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      console.log("Fetching classes for grade:", formData.gradeId);
      const response = await fetch(`/api/classes?gradeId=${formData.gradeId}`);
      console.log("Classes response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Raw classes response:", data);
        
        // Handle different response formats  
        let classesArray = [];
        if (Array.isArray(data)) {
          classesArray = data;
        } else if (data.classes && Array.isArray(data.classes)) {
          classesArray = data.classes;
        } else if (data.data && Array.isArray(data.data)) {
          classesArray = data.data;
        } else {
          console.warn("Unexpected classes data format:", data);
        }
        
        console.log("Processed classes array:", classesArray);
        setClasses(classesArray);
        
        // Initialize supervisors for each class
        const classesWithSupervisors = classesArray.map((classItem: any) => ({
          classId: classItem.id,
          className: classItem.name,
          teacherIds: []
        }));
        
        console.log("Initialized supervisors:", classesWithSupervisors);
        setFormData(prev => ({ ...prev, supervisors: classesWithSupervisors }));
        
        if (classesArray.length > 0) {
          console.log("✅ Successfully loaded", classesArray.length, "classes");
        } else {
          console.warn("⚠️ No classes found for grade", formData.gradeId);
        }
      } else {
        console.error("Failed to fetch classes:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Get all teachers for supervisor assignment using the "all" parameter
      const response = await fetch("/api/teachers?all=true&page=1");
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        let teachersArray = [];
        if (Array.isArray(data)) {
          teachersArray = data;
        } else if (data.teachers && Array.isArray(data.teachers)) {
          teachersArray = data.teachers;
        } else if (data.data && Array.isArray(data.data)) {
          teachersArray = data.data;
        }
        
        setTeachers(teachersArray);
      } else {
        console.error("Failed to fetch teachers:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check for potential conflicts when term changes
    if (field === 'term' && formData.gradeId && formData.year) {
      const checkData = { ...formData, [field]: value };
      checkForExistingExam(checkData);
    }
  };

  const checkForExistingExam = async (data: any) => {
    if (!data.gradeId || !data.year || !data.term) return;
    
    try {
      const response = await fetch(`/api/exams?gradeId=${data.gradeId}&year=${data.year}&term=${data.term}`);
      if (response.ok) {
        const existingExams = await response.json();
        if (existingExams.length > 0) {
          const existingExam = existingExams[0];
          toast.error(`⚠️ An exam "${existingExam.title}" already exists for this configuration. Please use different settings.`, {
            duration: 4000,
          });
        }
      }
    } catch (error) {
      // Silently ignore checking errors
      console.log("Could not check for existing exams:", error);
    }
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
    return formData.name && formData.year && formData.gradeId && formData.term;
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

    // Additional validation
    if (!formData.name || !formData.gradeId || !formData.year || !formData.term) {
      toast.error("Missing required exam information");
      return;
    }

    if (!formData.subjects || formData.subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }

    if (!formData.supervisors || formData.supervisors.length === 0) {
      toast.error("Please assign supervisors to classes");
      return;
    }

    // Check if all supervisors are assigned
    const unassignedClasses = formData.supervisors.filter(s => !s.teacherIds || s.teacherIds.length === 0);
    if (unassignedClasses.length > 0) {
      toast.error(`Please assign supervisors to: ${unassignedClasses.map(c => c.className).join(', ')}`);
      return;
    }

    // Check if all subjects have schedules set
    const subjectsWithoutSchedule = formData.subjects.filter(s => !s.examDate || !s.startTime || !s.endTime);
    if (subjectsWithoutSchedule.length > 0) {
      toast.error(`Please set schedule for: ${subjectsWithoutSchedule.map(s => s.name).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      console.log("🚀 Submitting exam data:");
      console.log("📋 Basic info:", {
        name: formData.name,
        year: formData.year,
        gradeId: formData.gradeId,
        term: formData.term,
        examType: formData.examType,
        status: formData.status
      });
      console.log("📚 Subjects:", formData.subjects);
      console.log("👥 Supervisors:", formData.supervisors);
      
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      console.log("📡 Response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Success:", result);
        toast.success("Exam created successfully!");
        router.push("/list/exams");
      } else {
        const errorData = await response.json();
        console.error("❌ Error response:", errorData);
        
        // Handle specific error messages
        if (errorData.error?.includes("already exists")) {
          toast.error(errorData.error);
          
          // Show suggestions if available
          if (errorData.suggestion) {
            setTimeout(() => {
              toast(errorData.suggestion, {
                duration: 8000,
                icon: '💡',
                style: {
                  maxWidth: '500px',
                  whiteSpace: 'pre-line',
                },
              });
            }, 1000);
          }
          
          // For unique constraint violations, suggest changing term or exam type
          if (errorData.error.includes("Only one exam per type")) {
            setTimeout(() => {
              const currentTerm = parseInt(formData.term);
              const nextTerm = currentTerm < 3 ? currentTerm + 1 : 1;
              toast(`💡 Quick Fix: Try changing to Term ${nextTerm} or use exam type "UNIT"`, {
                duration: 6000,
                icon: '�'
              });
            }, 2500);
          }
        } else {
          toast.error(errorData.error || `Failed to create exam (${response.status})`);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Failed to create exam - Network error");
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
            onBlur={async () => {
              // Check for duplicate names when user leaves the field
              if (formData.name && formData.gradeId && formData.year && formData.term) {
                try {
                  const response = await fetch(`/api/exams?gradeId=${formData.gradeId}&year=${formData.year}&term=${formData.term}`);
                  if (response.ok) {
                    const existingExams = await response.json();
                    const duplicateExists = existingExams.some((exam: any) => 
                      exam.title === formData.name
                    );
                    if (duplicateExists) {
                      const timestamp = new Date().getTime().toString().slice(-4);
                      const suggestedName = `${formData.name} (${timestamp})`;
                      toast(`⚠️ An exam with this name already exists. Consider: "${suggestedName}"`, {
                        duration: 4000,
                        icon: '⚠️'
                      });
                    }
                  }
                } catch (error) {
                  // Silently fail the check
                  console.log("Could not check for duplicates:", error);
                }
              }
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Grade 11 Term 1 Examination"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Each exam must have a unique name. Name will be auto-suggested based on your selections.
          </p>
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

  const renderStep2 = () => {
    // Suggested time slots
    const timeSlots = [
      { label: "Morning Session", start: "08:00", end: "10:30" },
      { label: "Mid-Morning", start: "10:45", end: "13:15" },
      { label: "Afternoon", start: "13:30", end: "16:00" },
      { label: "Evening", start: "16:15", end: "18:45" }
    ];

    const applyTimeSlotToAll = (startTime: string, endTime: string) => {
      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.map(subject => ({
          ...subject,
          startTime,
          endTime
        }))
      }));
      toast.success(`Applied ${startTime} - ${endTime} to all subjects`);
    };

    const applyDateToAll = (date: string) => {
      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.map(subject => ({
          ...subject,
          examDate: date
        }))
      }));
      toast.success(`Applied ${date} to all subjects`);
    };

    const applyTeacherToAll = (teacherId: string) => {
      // Remove this function as we no longer assign teachers to subjects
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">📅 Exam Schedule</h2>
            <p className="text-gray-600 text-sm mt-1">
              Set exam dates and times for each subject. Subject teachers will enter marks based on their assigned subjects.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            {formData.subjects.length} subjects for Grade {grades.find(g => g.id.toString() === formData.gradeId)?.level}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-3">⚡ Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bulk Date Setting */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Set Date for All Subjects:
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  onChange={(e) => e.target.value && applyDateToAll(e.target.value)}
                  className="flex-1 p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                💡 You can select past dates for historical exam records
              </p>
            </div>

            {/* Bulk Time Setting */}
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Set Time Slot for All Subjects:
              </label>
              <div className="grid grid-cols-2 gap-1">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => applyTimeSlotToAll(slot.start, slot.end)}
                    className="p-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border border-blue-300 transition-colors"
                  >
                    {slot.label}
                    <div className="text-blue-600">{slot.start}-{slot.end}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Note:</strong> Subject teachers will automatically be able to enter marks for their assigned subjects. 
              You only need to assign exam day supervisors (invigilators) in the next step.
            </p>
          </div>
        </div>
        
        {/* Subject List */}
        <div className="space-y-4">
          {formData.subjects.map((subject, index) => (
            <div key={subject.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="md:col-span-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{subject.name}</h3>
                      <p className="text-xs text-gray-500">Code: {subject.code || 'N/A'}</p>
                    </div>
                  </div>
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
                  <select
                    value={subject.startTime}
                    onChange={(e) => handleSubjectScheduleChange(subject.id, "startTime", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Time</option>
                    <option value="08:00">08:00 AM</option>
                    <option value="08:30">08:30 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="10:45">10:45 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="13:30">01:30 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subject.endTime}
                    onChange={(e) => handleSubjectScheduleChange(subject.id, "endTime", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Time</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="13:15">01:15 PM</option>
                    <option value="13:30">01:30 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="17:30">05:30 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="18:30">06:30 PM</option>
                    <option value="18:45">06:45 PM</option>
                  </select>
                </div>

                <div className="flex items-center">
                  {subject.examDate && subject.startTime && subject.endTime ? (
                    <div className="flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">Scheduled</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Schedule Progress:
            </span>
            <span className="text-sm text-gray-600">
              {formData.subjects.filter(s => s.examDate && s.startTime && s.endTime).length} / {formData.subjects.length} scheduled
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ 
                width: `${(formData.subjects.filter(s => s.examDate && s.startTime && s.endTime).length / formData.subjects.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {formData.subjects.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">No subjects found</p>
            <p className="text-gray-400">Please select a grade first to see subjects</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => {
    const completedClasses = formData.supervisors.filter(s => s.teacherIds.length > 0).length;
    const totalClasses = formData.supervisors.length;

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              👥 Exam Day Supervisors (Invigilators)
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Assign teachers for exam day supervision duties. Subject teachers will enter marks separately based on their subject assignments.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {teachers.length} teachers available
            </div>
            <div className="text-xs text-blue-600 font-medium">
              {completedClasses}/{totalClasses} classes assigned
            </div>
          </div>
        </div>

        {/* Progress Overview Card */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-800">📊 Assignment Progress</h3>
            <span className="text-sm text-blue-600">
              {completedClasses === totalClasses ? "✅ Complete" : `${totalClasses - completedClasses} remaining`}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                completedClasses === totalClasses ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${totalClasses > 0 ? (completedClasses / totalClasses) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-600 mt-1">
            <span>0</span>
            <span>{totalClasses} classes</span>
          </div>
        </div>

        {/* Loading Teachers Message */}
        {teachers.length === 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
              <div>
                <h3 className="font-medium text-blue-800">Loading Teachers...</h3>
                <p className="text-blue-600 text-sm">
                  Please wait while we load the teacher data. If this persists, please refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Class Assignment Cards */}
        <div className="space-y-4">
          {formData.supervisors.map((supervisor, index) => (
            <div key={supervisor.classId} className={`p-5 border-2 rounded-lg transition-all duration-200 ${
              supervisor.teacherIds.length > 0 
                ? 'border-green-200 bg-green-50 hover:border-green-300' 
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                      supervisor.teacherIds.length > 0 
                        ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                        : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    }`}>
                      {supervisor.teacherIds.length > 0 ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {supervisor.className}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Select supervisors for entire exam session
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {supervisor.teacherIds.length > 0 ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">{supervisor.teacherIds.length} assigned</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-orange-500">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Needs supervisor</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Teachers <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1 block mt-1">
                    Choose one or more teachers to supervise this class during exams
                  </span>
                </label>

                {teachers.length > 0 ? (
                  <div>
                    {/* Search box for teachers */}
                    <div className="mb-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search teachers by name..."
                          value={teacherSearch[supervisor.classId] || ""}
                          onChange={(e) => {
                            setTeacherSearch(prev => ({
                              ...prev,
                              [supervisor.classId]: e.target.value
                            }));
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Teachers selection grid */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {teachers.filter(teacher => {
                          const searchTerm = teacherSearch[supervisor.classId] || "";
                          if (!searchTerm) return true;
                          const fullName = `${teacher.name} ${teacher.surname}`.toLowerCase();
                          return fullName.includes(searchTerm.toLowerCase());
                        }).map(teacher => {
                          const isSelected = supervisor.teacherIds.includes(teacher.id);
                          return (
                            <label key={teacher.id} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-blue-100 border-2 border-blue-300 text-blue-800' 
                                : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newTeacherIds = e.target.checked
                                    ? [...supervisor.teacherIds, teacher.id]
                                    : supervisor.teacherIds.filter((id: string) => id !== teacher.id);
                                  handleSupervisorChange(supervisor.classId, newTeacherIds);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {teacher.name} {teacher.surname}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Teacher
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-blue-600">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected teachers summary */}
                    {supervisor.teacherIds.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Selected Supervisors ({supervisor.teacherIds.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {supervisor.teacherIds.map((teacherId: string) => {
                            const teacher = teachers.find(t => t.id === teacherId);
                            return teacher ? (
                              <span key={teacherId} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-300">
                                <span className="mr-2">👨‍🏫</span>
                                {teacher.name} {teacher.surname}
                                <button
                                  onClick={() => {
                                    const newTeacherIds = supervisor.teacherIds.filter((id: string) => id !== teacherId);
                                    handleSupervisorChange(supervisor.classId, newTeacherIds);
                                  }}
                                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
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
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <p className="font-medium">No teachers available</p>
                    <p className="text-sm mt-1">Please contact administrator or try refetching</p>
                  </div>
                )}
              </div>

              {/* Warning if no supervisors assigned */}
              {supervisor.teacherIds.length === 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-orange-700 font-medium">
                      This class requires at least one supervisor before creating the exam
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {formData.supervisors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-500 mb-2">No Classes Found</h3>
            <p className="text-gray-400 mb-4">Please select a grade in Step 1 to see available classes</p>
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Step 1
            </button>
          </div>
        )}
      </div>
    );
  };

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
