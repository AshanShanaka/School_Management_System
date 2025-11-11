'use client';

import React from 'react';

// Define the types expected by TimetableCreationForm
interface Subject {
  id: number;
  name: string;
  code?: string | null;
  teachers: Teacher[];
}

interface Teacher {
  id: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
}

interface Class {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
    level: number;
  };
}

interface TimetableCreationFormWrapperProps {
  selectedClass: Class;
  subjects: Subject[];
}

// Temporary simple component to test if the issue is with the main component
const TimetableCreationForm: React.FC<TimetableCreationFormWrapperProps> = ({
  selectedClass,
  subjects
}) => {
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">
        Create Timetable for {selectedClass.name}
      </h2>
      <p className="text-gray-600 mb-4">
        Available subjects: {subjects.length}
      </p>
      <div className="bg-blue-50 p-4 rounded">
        <p>Timetable creation form will be loaded here.</p>
        <p>Debug: Class ID {selectedClass.id}, Subjects: {subjects.map(s => s.name).join(', ')}</p>
      </div>
    </div>
  );
};

export default function TimetableCreationFormWrapper({ 
  selectedClass, 
  subjects 
}: TimetableCreationFormWrapperProps) {
  return (
    <TimetableCreationForm 
      selectedClass={selectedClass} 
      subjects={subjects} 
    />
  );
}
