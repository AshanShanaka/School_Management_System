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

// Excel Import Schemas - Handle Excel numeric values properly
export const excelStudentParentSchema = z.object({
  student_email: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim().toLowerCase())
    .refine((val) => val.includes("@"), {
      message: "Student email must contain @",
    }),
  student_password: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  student_first_name: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  student_last_name: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  student_phone: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  student_birthday: z
    .union([z.string(), z.number(), z.date()])
    .transform((val) => {
      if (val instanceof Date) return val.toISOString().split("T")[0];
      if (typeof val === "number") {
        // Excel serial date conversion
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split("T")[0];
      }
      return String(val);
    }),
  student_class: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  student_grade: z
    .union([z.string(), z.number()])
    .transform((val) => String(val)),
  student_sex: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).toUpperCase())
    .refine((val) => ["MALE", "FEMALE", "M", "F"].includes(val), {
      message: "Student sex must be MALE/M or FEMALE/F!",
    })
    .transform((val) => (val === "M" ? "MALE" : val === "F" ? "FEMALE" : val)),
  address: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  parent_email: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim().toLowerCase())
    .refine((val) => val.includes("@"), {
      message: "Parent email must contain @",
    }),
  parent_password: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  parent_first_name: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  parent_last_name: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  parent_phone: z
    .union([z.string(), z.number()])
    .transform((val) => String(val)),
  parent_birthday: z
    .union([z.string(), z.number(), z.date()])
    .transform((val) => {
      if (val instanceof Date) return val.toISOString().split("T")[0];
      if (typeof val === "number") {
        // Excel serial date conversion
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split("T")[0];
      }
      return String(val);
    }),
  parent_sex: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).toUpperCase())
    .refine((val) => ["MALE", "FEMALE", "M", "F"].includes(val), {
      message: "Parent sex must be MALE/M or FEMALE/F!",
    })
    .transform((val) => (val === "M" ? "MALE" : val === "F" ? "FEMALE" : val)),
});

export const excelTeacherSchema = z.object({
  teacher_email: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim().toLowerCase())
    .refine((val) => val.includes("@"), {
      message: "Teacher email must contain @",
    }),
  teacher_password: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  teacher_first_name: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  teacher_last_name: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  teacher_phone: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(),
  teacher_birthday: z
    .union([z.string(), z.number(), z.date()])
    .transform((val) => {
      if (val instanceof Date) return val.toISOString().split("T")[0];
      if (typeof val === "number") {
        // Excel serial date conversion
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString().split("T")[0];
      }
      return String(val);
    }),
  teacher_sex: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).toUpperCase())
    .refine((val) => ["MALE", "FEMALE", "M", "F"].includes(val), {
      message: "Teacher sex must be MALE/M or FEMALE/F!",
    })
    .transform((val) => (val === "M" ? "MALE" : val === "F" ? "FEMALE" : val)),
  address: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim()),
  subjects: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional(), // Comma-separated subject names
});

export type ExcelStudentParentSchema = z.infer<typeof excelStudentParentSchema>;
export type ExcelTeacherSchema = z.infer<typeof excelTeacherSchema>;
