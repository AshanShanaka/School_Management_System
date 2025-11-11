import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Type definitions for the school management system
export type SchoolRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface UserData {
  id: string;
  name?: string;
  email?: string;
  role: SchoolRole;
  [key: string]: any;
}

export interface FormState {
  success: boolean;
  error: boolean;
  message?: string;
}

export interface TableColumn {
  header: string;
  accessor: string;
  className?: string;
}

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export interface PageProps {
  params: { [key: string]: string };
  searchParams: SearchParams;
}

// Database model types
export interface Class {
  id: number;
  name: string;
  capacity: number;
  supervisorId?: string;
  gradeId: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface Teacher {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address: string;
  img?: string;
  bloodType: string;
  sex: 'MALE' | 'FEMALE';
  createdAt: Date;
  birthday: Date;
  [key: string]: any;
}

export interface Student {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address: string;
  img?: string;
  bloodType: string;
  sex: 'MALE' | 'FEMALE';
  createdAt: Date;
  birthday: Date;
  classId: number;
  gradeId: number;
  parentId: string;
  [key: string]: any;
}

export interface Grade {
  id: number;
  level: number;
  [key: string]: any;
}

export interface Subject {
  id: number;
  name: string;
  [key: string]: any;
}

export interface Lesson {
  id: number;
  name: string;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  startTime: Date;
  endTime: Date;
  subjectId: number;
  classId: number;
  teacherId: string;
  [key: string]: any;
}

export interface Exam {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  lessonId: number;
  examTypeId: number;
  [key: string]: any;
}

export interface Assignment {
  id: number;
  title: string;
  startDate: Date;
  dueDate: Date;
  lessonId: number;
  [key: string]: any;
}

export interface Result {
  id: number;
  score: number;
  studentId: string;
  examId?: number;
  assignmentId?: number;
  [key: string]: any;
}

export interface Attendance {
  id: number;
  date: Date;
  present: boolean;
  studentId: string;
  lessonId: number;
  [key: string]: any;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  classId?: number;
  [key: string]: any;
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  date: Date;
  classId?: number;
  [key: string]: any;
}

export const currentWorkWeek = (): Date => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(today.setDate(diff));
};

export const adjustScheduleToCurrentWeek = (
  lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
  const startOfWeek = currentWorkWeek();
  return lessons.map((lesson) => {
    const lessonDayOfWeek = lesson.start.getDay();
    const dayFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

    const adjustedStartDate = new Date(startOfWeek);
    adjustedStartDate.setDate(startOfWeek.getDate() + dayFromMonday);
    adjustedStartDate.setHours(
      lesson.start.getHours(),
      lesson.start.getMinutes(),
      lesson.start.getSeconds()
    );

    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(
      lesson.end.getHours(),
      lesson.end.getMinutes(),
      lesson.end.getSeconds()
    );

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleTimeString();
};

export const formatDateTime = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleString();
};

export const calculateAge = (birthday: Date | string): number => {
  const birthDate = typeof birthday === 'string' ? new Date(birthday) : birthday;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Form validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  return value != null && value !== undefined;
};

// Error handling utilities
export const handleError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const createErrorResponse = (message: string, status = 500) => {
  return {
    success: false,
    error: true,
    message,
    status
  };
};

export const createSuccessResponse = (data?: any, message = 'Success') => {
  return {
    success: true,
    error: false,
    message,
    data
  };
};
