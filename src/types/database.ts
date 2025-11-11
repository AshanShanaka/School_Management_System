// Global parameter type fixes for implicit 'any' errors

// Database model types with complete definitions
export interface Teacher {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  img?: string | null;
  bloodType: string;
  sex: 'MALE' | 'FEMALE';
  createdAt: Date;
  birthday: Date;
  subjects?: Subject[];
  lessons?: Lesson[];
  classes?: Class[];
  [key: string]: any;
}

export interface Student {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  img?: string | null;
  bloodType: string;
  sex: 'MALE' | 'FEMALE';
  createdAt: Date;
  birthday: Date;
  classId: number;
  gradeId: number;
  parentId: string;
  class?: Class;
  grade?: Grade;
  parent?: Parent;
  attendances?: Attendance[];
  results?: Result[];
  [key: string]: any;
}

export interface Class {
  id: number;
  name: string;
  capacity: number;
  supervisorId?: string | null;
  gradeId: number;
  createdAt: Date;
  updatedAt: Date;
  supervisor?: Teacher | null;
  grade?: Grade;
  students?: Student[];
  lessons?: Lesson[];
  events?: Event[];
  announcements?: Announcement[];
  [key: string]: any;
}

export interface Subject {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  teachers?: Teacher[];
  lessons?: Lesson[];
  [key: string]: any;
}

export interface Grade {
  id: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
  classes?: Class[];
  students?: Student[];
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
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  class?: Class;
  teacher?: Teacher;
  attendances?: Attendance[];
  assignments?: Assignment[];
  exams?: Exam[];
  [key: string]: any;
}

export interface Exam {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  lessonId: number;
  examTypeId: number;
  createdAt: Date;
  updatedAt: Date;
  lesson?: Lesson;
  examType?: ExamType;
  results?: Result[];
  [key: string]: any;
}

export interface ExamType {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  exams?: Exam[];
  [key: string]: any;
}

export interface Assignment {
  id: number;
  title: string;
  startDate: Date;
  dueDate: Date;
  lessonId: number;
  createdAt: Date;
  updatedAt: Date;
  lesson?: Lesson;
  results?: Result[];
  [key: string]: any;
}

export interface Result {
  id: number;
  score: number;
  studentId: string;
  examId?: number | null;
  assignmentId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  student?: Student;
  exam?: Exam | null;
  assignment?: Assignment | null;
  [key: string]: any;
}

export interface Attendance {
  id: number;
  date: Date;
  present: boolean;
  studentId: string;
  lessonId: number;
  createdAt: Date;
  updatedAt: Date;
  student?: Student;
  lesson?: Lesson;
  [key: string]: any;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  classId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  class?: Class | null;
  [key: string]: any;
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  date: Date;
  classId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  class?: Class | null;
  [key: string]: any;
}

export interface Parent {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string | null;
  phone: string;
  address: string;
  createdAt: Date;
  students?: Student[];
  [key: string]: any;
}

export interface Admin {
  id: string;
  username: string;
  [key: string]: any;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  date: Date;
  userId: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

// Common parameter types for functions
export type ItemType = Teacher | Student | Class | Subject | Grade | Lesson | Exam | Assignment | Result | Attendance | Event | Announcement | Parent | Admin;

export type SortCompareFn<T = any> = (a: T, b: T) => number;

export type FilterFn<T = any> = (item: T) => boolean;

export type MapFn<T = any, R = any> = (item: T, index?: number, array?: T[]) => R;

export type ReduceFn<T = any, R = any> = (accumulator: R, currentValue: T, currentIndex?: number, array?: T[]) => R;

// Transaction type for Prisma
export interface PrismaTransaction {
  [key: string]: any;
}

// Common utility types
export type DatabaseRecord = {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

export type QueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
};

export type FormDataValue = string | File | null;

export type FormDataObject = {
  [key: string]: FormDataValue | FormDataValue[];
};

// Helper functions with proper typing
export const typedObjectEntries = <T extends Record<string, any>>(
  obj: T
): Array<[keyof T, T[keyof T]]> => {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
};

export const typedObjectValues = <T extends Record<string, any>>(
  obj: T
): Array<T[keyof T]> => {
  return Object.values(obj) as Array<T[keyof T]>;
};

export const typedObjectKeys = <T extends Record<string, any>>(
  obj: T
): Array<keyof T> => {
  return Object.keys(obj) as Array<keyof T>;
};

// Type guards
export const isTeacher = (item: any): item is Teacher => {
  return item && typeof item.id === 'string' && 'subjects' in item;
};

export const isStudent = (item: any): item is Student => {
  return item && typeof item.id === 'string' && 'classId' in item;
};

export const isClass = (item: any): item is Class => {
  return item && typeof item.id === 'number' && 'capacity' in item;
};

export const isSubject = (item: any): item is Subject => {
  return item && typeof item.id === 'number' && 'name' in item && !('capacity' in item);
};

// Prisma transaction type helper
export type TransactionCallback<T> = (tx: PrismaTransaction) => Promise<T>;

export default {
  Teacher,
  Student,
  Class,
  Subject,
  Grade,
  Lesson,
  Exam,
  Assignment,
  Result,
  Attendance,
  Event,
  Announcement,
  Parent,
  Admin,
  typedObjectEntries,
  typedObjectValues,
  typedObjectKeys,
  isTeacher,
  isStudent,
  isClass,
  isSubject
};
