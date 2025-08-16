import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  examTypeId: z.coerce.number().min(1, { message: "Exam type is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  startDate: z.string().min(1, { message: "Start date is required!" }),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endDate: z.string().min(1, { message: "End date is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
  duration: z.string().min(1, { message: "Duration is required!" }),
  venue: z.string().optional(),
  day: z
    .enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"])
    .optional(),
  subjectCode: z.string().optional(),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const gradeSchema = z.object({
  id: z.coerce.number().optional(),
  level: z.coerce.number().min(1, { message: "Grade level is required!" }),
});

export type GradeSchema = z.infer<typeof gradeSchema>;

export const assignmentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title is required!" }),
  lessonId: z.coerce.number().min(1, { message: "Lesson is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
});

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const lessonSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
});

export type LessonSchema = z.infer<typeof lessonSchema>;

// Excel Import Schemas
export const excelStudentParentSchema = z
  .object({
    student_email: z
      .string()
      .email({ message: "Invalid student email address!" })
      .transform((val) => val.trim().toLowerCase()),
    student_password: z
      .string()
      .min(8, {
        message: "Student password must be at least 8 characters long!",
      })
      .max(128, { message: "Student password too long!" }),
    student_first_name: z
      .string()
      .min(1, { message: "Student first name is required!" })
      .max(50, { message: "Student first name too long!" })
      .transform((val) => val.trim()),
    student_last_name: z
      .string()
      .min(1, { message: "Student last name is required!" })
      .max(50, { message: "Student last name too long!" })
      .transform((val) => val.trim()),
    student_phone: z.string().optional(),
    student_birthday: z
      .string()
      .min(1, { message: "Student birthday is required!" })
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime()) && date < new Date();
        },
        { message: "Invalid student birthday format or future date!" }
      ),
    student_class: z
      .string()
      .min(1, { message: "Student class is required!" })
      .max(20, { message: "Student class name too long!" }),
    student_grade: z
      .string()
      .min(1, { message: "Student grade is required!" })
      .refine(
        (val) => {
          const grade = parseInt(val);
          return !isNaN(grade) && grade >= 1 && grade <= 12;
        },
        { message: "Student grade must be between 1 and 12!" }
      ),
    student_sex: z.enum(["MALE", "FEMALE"], {
      message: "Student sex must be MALE or FEMALE!",
    }),
    address: z
      .string()
      .min(1, { message: "Address is required!" })
      .max(200, { message: "Address too long!" }),
    parent_email: z
      .string()
      .email({ message: "Invalid parent email address!" })
      .transform((val) => val.trim().toLowerCase()),
    parent_password: z
      .string()
      .min(8, {
        message: "Parent password must be at least 8 characters long!",
      })
      .max(128, { message: "Parent password too long!" }),
    parent_first_name: z
      .string()
      .min(1, { message: "Parent first name is required!" })
      .max(50, { message: "Parent first name too long!" })
      .transform((val) => val.trim()),
    parent_last_name: z
      .string()
      .min(1, { message: "Parent last name is required!" })
      .max(50, { message: "Parent last name too long!" })
      .transform((val) => val.trim()),
    parent_phone: z
      .string()
      .min(1, { message: "Parent phone is required!" })
      .max(20, { message: "Parent phone too long!" }),
    parent_birthday: z
      .string()
      .min(1, { message: "Parent birthday is required!" })
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime()) && date < new Date();
        },
        { message: "Invalid parent birthday format or future date!" }
      ),
    parent_sex: z.enum(["MALE", "FEMALE"], {
      message: "Parent sex must be MALE or FEMALE!",
    }),
  })
  .refine((data) => data.student_email !== data.parent_email, {
    message: "Student and parent must have different email addresses!",
    path: ["parent_email"],
  });

export const excelTeacherSchema = z.object({
  teacher_email: z
    .string()
    .email({ message: "Invalid teacher email address!" })
    .transform((val) => val.trim().toLowerCase()),
  teacher_password: z
    .string()
    .min(8, { message: "Teacher password must be at least 8 characters long!" })
    .max(128, { message: "Teacher password too long!" }),
  teacher_first_name: z
    .string()
    .min(1, { message: "Teacher first name is required!" })
    .max(50, { message: "Teacher first name too long!" })
    .transform((val) => val.trim()),
  teacher_last_name: z
    .string()
    .min(1, { message: "Teacher last name is required!" })
    .max(50, { message: "Teacher last name too long!" })
    .transform((val) => val.trim()),
  teacher_phone: z.string().optional(),
  teacher_birthday: z
    .string()
    .min(1, { message: "Teacher birthday is required!" })
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      },
      { message: "Invalid teacher birthday format or future date!" }
    ),
  teacher_sex: z.enum(["MALE", "FEMALE"], {
    message: "Teacher sex must be MALE or FEMALE!",
  }),
  address: z
    .string()
    .min(1, { message: "Address is required!" })
    .max(200, { message: "Address too long!" }),
  subjects: z.string().optional(), // Comma-separated subject names
});

export type ExcelStudentParentSchema = z.infer<typeof excelStudentParentSchema>;
export type ExcelTeacherSchema = z.infer<typeof excelTeacherSchema>;
