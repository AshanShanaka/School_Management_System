import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import {
  excelStudentParentSchema,
  excelTeacherSchema,
} from "@/lib/formValidationSchemas";
import { debugExcelData, validateExcelData } from "@/lib/excelValidation";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  deletedUsers?: {
    students: number;
    parents: number;
    teachers: number;
  };
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  skipped: Array<{
    row: number;
    data: any;
    reason: string;
  }>;
}

interface ProcessedUser {
  clerkId?: string;
  isNew: boolean;
  email: string;
  role: string;
}

// Helper function to generate username from email
function generateUsername(email: string): string {
  const baseUsername = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove all non-alphanumeric characters
    .substring(0, 15); // Limit length to avoid issues

  // Ensure username starts with a letter (Clerk requirement)
  if (!/^[a-z]/.test(baseUsername)) {
    return `user${baseUsername}`;
  }

  return baseUsername || "user"; // Fallback if empty
}

// Helper function to parse Excel file and convert to structured data
async function parseExcelFile(file: File): Promise<any[]> {
  try {
    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Excel file has no worksheets");
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row as keys
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use first row as header
      defval: "", // Default value for empty cells
      blankrows: false, // Skip blank rows
    });

    if (jsonData.length < 2) {
      throw new Error(
        "Excel file must have at least a header row and one data row"
      );
    }

    // Convert to object format with headers as keys
    const headers = jsonData[0] as string[];
    const records = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      const record: any = {};

      headers.forEach((header, index) => {
        // Clean up header name and cell value
        const cleanHeader = header?.toString().trim() || `column_${index}`;
        let cellValue = row[index];

        // Handle date values from Excel
        if (
          cellValue &&
          typeof cellValue === "number" &&
          cleanHeader.includes("birthday")
        ) {
          // Excel stores dates as numbers, convert to ISO date string
          const excelDate = XLSX.SSF.parse_date_code(cellValue);
          if (excelDate) {
            cellValue = `${excelDate.y}-${String(excelDate.m).padStart(
              2,
              "0"
            )}-${String(excelDate.d).padStart(2, "0")}`;
          }
        }

        // Convert to string and trim
        record[cleanHeader] = cellValue?.toString().trim() || "";
      });

      records.push(record);
    }

    return records;
  } catch (error: any) {
    console.error("Error parsing Excel file:", error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

// Helper function to parse Excel file and return uniform data
async function parseFile(file: File): Promise<any[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    // Parse Excel file
    return await parseExcelFile(file);
  } else {
    throw new Error(
      "Unsupported file format. Only Excel files (.xlsx, .xls) are supported."
    );
  }
}

// Helper function to generate a secure password that meets basic requirements
function generateSecurePassword(basePassword: string): string {
  // If the password is at least 5 characters, use it as-is
  if (basePassword.length >= 5) {
    return basePassword;
  }

  // If too short, pad with numbers to reach 5 characters
  let password = basePassword;
  while (password.length < 5) {
    password += Math.floor(Math.random() * 10).toString();
  }

  return password;
}

// Helper function to delete user from Clerk and database
async function deleteUserFromClerkAndDatabase(
  userId: string,
  userType: "student" | "parent" | "teacher"
): Promise<void> {
  try {
    // Delete from Clerk
    await clerkClient.users.deleteUser(userId);
    console.log(`Deleted user ${userId} from Clerk`);

    // Delete from database based on user type
    switch (userType) {
      case "student":
        await prisma.student.delete({ where: { id: userId } });
        break;
      case "parent":
        await prisma.parent.delete({ where: { id: userId } });
        break;
      case "teacher":
        await prisma.teacher.delete({ where: { id: userId } });
        break;
    }
    console.log(`Deleted user ${userId} from database as ${userType}`);
  } catch (error: any) {
    console.error(`Failed to delete user ${userId}:`, error);
    // Don't throw error - continue with other operations
  }
}

// Helper function to get existing users by email for sync comparison
async function getExistingUsersByEmail(
  userType: "students-parents" | "teachers"
): Promise<Set<string>> {
  const emails = new Set<string>();

  if (userType === "students-parents") {
    // Get all student emails
    const students = await prisma.student.findMany({ select: { email: true } });
    students.forEach((s) => s.email && emails.add(s.email.toLowerCase()));

    // Get all parent emails
    const parents = await prisma.parent.findMany({ select: { email: true } });
    parents.forEach((p) => p.email && emails.add(p.email.toLowerCase()));
  } else {
    // Get all teacher emails
    const teachers = await prisma.teacher.findMany({ select: { email: true } });
    teachers.forEach((t) => t.email && emails.add(t.email.toLowerCase()));
  }

  return emails;
}

// Helper function to find users to delete (exist in DB but not in Excel)
async function findUsersToDelete(
  excelEmails: Set<string>,
  userType: "students-parents" | "teachers"
): Promise<{
  studentsToDelete: string[];
  parentsToDelete: string[];
  teachersToDelete: string[];
}> {
  const result = {
    studentsToDelete: [] as string[],
    parentsToDelete: [] as string[],
    teachersToDelete: [] as string[],
  };

  if (userType === "students-parents") {
    // Find students not in Excel
    const students = await prisma.student.findMany({
      select: { id: true, email: true },
    });
    students.forEach((student) => {
      if (student.email && !excelEmails.has(student.email.toLowerCase())) {
        result.studentsToDelete.push(student.id);
      }
    });

    // Find parents not in Excel
    const parents = await prisma.parent.findMany({
      select: { id: true, email: true },
    });
    parents.forEach((parent) => {
      if (parent.email && !excelEmails.has(parent.email.toLowerCase())) {
        result.parentsToDelete.push(parent.id);
      }
    });
  } else {
    // Find teachers not in Excel
    const teachers = await prisma.teacher.findMany({
      select: { id: true, email: true },
    });
    teachers.forEach((teacher) => {
      if (teacher.email && !excelEmails.has(teacher.email.toLowerCase())) {
        result.teachersToDelete.push(teacher.id);
      }
    });
  }

  return result;
}

// Helper function to create or update user in Clerk
async function createOrUpdateClerkUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string
): Promise<ProcessedUser> {
  try {
    // Validate and sanitize input data
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFirstName = firstName.trim();
    const sanitizedLastName = lastName.trim();
    const originalPassword = password.trim();

    // Generate a secure password that meets Clerk requirements
    const sanitizedPassword = generateSecurePassword(originalPassword);

    console.log("Processing user:", {
      originalEmail: email,
      sanitizedEmail,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      role,
      originalPasswordLength: originalPassword.length,
      securePasswordLength: sanitizedPassword.length,
      passwordWasModified: originalPassword !== sanitizedPassword,
    });

    // Additional validation
    if (
      !sanitizedEmail ||
      !sanitizedFirstName ||
      !sanitizedLastName ||
      !sanitizedPassword
    ) {
      throw new Error("Missing required user information");
    }

    // Validate email format
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(sanitizedEmail)) {
      throw new Error(`Invalid email format: ${sanitizedEmail}`);
    }

    // Check for name validation issues that could cause problems
    const nameRegex = /^[a-zA-Z\s\-'.]+$/;
    if (!nameRegex.test(sanitizedFirstName)) {
      throw new Error(
        `First name contains invalid characters: ${sanitizedFirstName}`
      );
    }

    if (!nameRegex.test(sanitizedLastName)) {
      throw new Error(
        `Last name contains invalid characters: ${sanitizedLastName}`
      );
    }

    // First, try to find existing user by email
    const existingUsers = await clerkClient.users.getUserList({
      emailAddress: [sanitizedEmail],
    });

    if (existingUsers.data.length > 0) {
      // User exists, update their information
      const existingUser = existingUsers.data[0];

      console.log("Updating existing Clerk user:", {
        clerkId: existingUser.id,
        email: sanitizedEmail,
        username: existingUser.username,
      });

      await clerkClient.users.updateUser(existingUser.id, {
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        publicMetadata: { role },
        // Note: We don't update password for existing users for security reasons
      });

      console.log("Successfully updated Clerk user:", {
        clerkId: existingUser.id,
        email: sanitizedEmail,
      });

      return {
        clerkId: existingUser.id,
        isNew: false,
        email: sanitizedEmail,
        role,
      };
    } else {
      // User doesn't exist, create new user
      const baseUsername = generateUsername(sanitizedEmail);

      // Check if username already exists and make it unique if needed
      let username = baseUsername;
      let usernameExists = true;
      let counter = 1;

      while (usernameExists) {
        try {
          const existingUsersByUsername = await clerkClient.users.getUserList({
            username: [username],
          });

          if (existingUsersByUsername.data.length === 0) {
            usernameExists = false;
          } else {
            username = `${baseUsername}${counter}`;
            counter++;
          }
        } catch (error) {
          // If we can't check username, proceed with current one
          break;
        }
      }

      console.log("Creating new Clerk user:", {
        email: sanitizedEmail,
        username,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        role,
        passwordLength: sanitizedPassword.length,
        passwordValid: sanitizedPassword.length >= 5,
      });

      const newUser = await clerkClient.users.createUser({
        emailAddress: [sanitizedEmail],
        username,
        password: sanitizedPassword,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        publicMetadata: { role },
      });

      console.log("Successfully created Clerk user:", {
        clerkId: newUser.id,
        email: sanitizedEmail,
        username: newUser.username,
      });

      return {
        clerkId: newUser.id,
        isNew: true,
        email: sanitizedEmail,
        role,
      };
    }
  } catch (error: any) {
    console.error("Detailed Clerk error:", {
      email,
      firstName,
      lastName,
      role,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorStatus: error?.status,
      errorErrors: error?.errors,
      errorClerkTraceId: error?.clerkTraceId,
      fullError: error,
      errorString: String(error),
    });

    // Provide more specific error messages based on Clerk error types
    let errorMessage = "Failed to create/update user in authentication system";

    // Handle specific Clerk error cases
    if (error?.status === 422 || error?.message === "Unprocessable Entity") {
      errorMessage += ": Data validation failed";

      // Try to extract specific validation errors from Clerk response
      if (error?.errors && Array.isArray(error.errors)) {
        const validationErrors = error.errors
          .map((e: any) => {
            if (e.message) return e.message;
            if (e.code) return `Error code: ${e.code}`;
            if (e.meta?.param_name) return `Invalid ${e.meta.param_name}`;
            return String(e);
          })
          .join(", ");
        errorMessage += ` (${validationErrors})`;
      } else {
        errorMessage +=
          " - Please check that all fields are filled correctly (password needs at least 5 characters)";
      }
    } else if (error?.message) {
      if (error.message.includes("already exists")) {
        errorMessage += ": Email or username already exists";
      } else if (error.message.includes("password")) {
        errorMessage += ": Password does not meet requirements";
      } else if (error.message.includes("email")) {
        errorMessage += ": Invalid email format";
      } else if (error.message.includes("username")) {
        errorMessage += ": Invalid username format";
      } else {
        errorMessage += `: ${error.message}`;
      }
    } else if (error?.errors && Array.isArray(error.errors)) {
      // Handle Clerk validation errors
      const clerkErrors = error.errors
        .map((e: any) => e.message || e.code || String(e))
        .join(", ");
      errorMessage += `: ${clerkErrors}`;
    } else if (error?.code) {
      errorMessage += `: Error code ${error.code}`;
    } else if (error?.status) {
      errorMessage += `: HTTP status ${error.status}`;
    } else {
      // Fallback: convert error to string
      const errorStr = String(error);
      if (errorStr !== "[object Object]") {
        errorMessage += `: ${errorStr}`;
      } else {
        errorMessage += ": Unknown error structure";
      }
    }

    throw new Error(errorMessage);
  }
}

// Helper function to create or update user in Clerk
async function findOrCreateClass(
  className: string,
  gradeLevel: number
): Promise<number> {
  // First try to find existing class
  let existingClass = await prisma.class.findFirst({
    where: {
      name: className,
      grade: {
        level: gradeLevel,
      },
    },
  });

  if (existingClass) {
    return existingClass.id;
  }

  // Find or create grade
  let grade = await prisma.grade.findUnique({
    where: { level: gradeLevel },
  });

  if (!grade) {
    grade = await prisma.grade.create({
      data: { level: gradeLevel },
    });
  }

  // Create new class
  const newClass = await prisma.class.create({
    data: {
      name: className,
      capacity: 30, // Default capacity
      gradeId: grade.id,
    },
  });

  return newClass.id;
}

// Helper function to find subjects by names
async function findSubjectsByNames(subjectNames: string[]): Promise<number[]> {
  const subjects = await prisma.subject.findMany({
    where: {
      name: {
        in: subjectNames,
      },
    },
  });

  return subjects.map((s) => s.id);
}

// Process students and parents data (from Excel)
async function processStudentsParentsData(
  records: any[],
  fileType: string,
  syncMode: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    totalRows: 0,
    successfulImports: 0,
    deletedUsers: {
      students: 0,
      parents: 0,
      teachers: 0,
    },
    errors: [],
    skipped: [],
  };

  try {
    result.totalRows = records.length;

    // Handle sync mode - delete users not in Excel
    if (syncMode) {
      console.log("Sync mode enabled - checking for users to delete...");

      // Get emails from Excel file
      const excelEmails = new Set<string>();
      records.forEach((record) => {
        if (record.student_email)
          excelEmails.add(record.student_email.toLowerCase());
        if (record.parent_email)
          excelEmails.add(record.parent_email.toLowerCase());
      });

      // Find users to delete
      const usersToDelete = await findUsersToDelete(
        excelEmails,
        "students-parents"
      );

      // Delete students not in Excel
      for (const studentId of usersToDelete.studentsToDelete) {
        await deleteUserFromClerkAndDatabase(studentId, "student");
        result.deletedUsers!.students++;
      }

      // Delete parents not in Excel
      for (const parentId of usersToDelete.parentsToDelete) {
        await deleteUserFromClerkAndDatabase(parentId, "parent");
        result.deletedUsers!.parents++;
      }

      console.log(
        `Sync cleanup: Deleted ${result.deletedUsers!.students} students and ${
          result.deletedUsers!.parents
        } parents`
      );
    }

    // Pre-validate all data
    const validationResults = validateExcelData(records, "students-parents");
    console.log("Validation Summary:", validationResults.summary);

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // Adding 2 because: 1-based indexing + header row
      const record = records[i];

      try {
        // Check if this row had validation errors
        const rowValidation = validationResults.results[i];
        if (!rowValidation.isValid) {
          const errorMessages = rowValidation.errors
            .map((e: any) => e.message)
            .join("; ");
          throw new Error(`Validation failed: ${errorMessages}`);
        }

        // Validate row data with Zod schema
        const validatedData = excelStudentParentSchema.parse(record);

        // Start transaction for this row
        await prisma.$transaction(async (tx) => {
          // Process parent first
          // Create or update parent in Clerk
          const parentClerkUser = await createOrUpdateClerkUser(
            validatedData.parent_email,
            validatedData.parent_password,
            validatedData.parent_first_name,
            validatedData.parent_last_name,
            "parent"
          );

          if (!parentClerkUser.clerkId) {
            throw new Error("Failed to create parent in authentication system");
          }

          // Create or update parent in database
          const parentData = {
            username: generateUsername(validatedData.parent_email),
            name: validatedData.parent_first_name,
            surname: validatedData.parent_last_name,
            email: validatedData.parent_email,
            phone: validatedData.parent_phone,
            address: validatedData.address,
            sex: validatedData.parent_sex,
            birthday: new Date(validatedData.parent_birthday),
          };

          let parent;
          if (parentClerkUser.isNew) {
            parent = await tx.parent.create({
              data: {
                id: parentClerkUser.clerkId,
                ...parentData,
              },
            });
          } else {
            parent = await tx.parent.upsert({
              where: { id: parentClerkUser.clerkId },
              update: parentData,
              create: {
                id: parentClerkUser.clerkId,
                ...parentData,
              },
            });
          }

          // Process student
          // Create or update student in Clerk
          const studentClerkUser = await createOrUpdateClerkUser(
            validatedData.student_email,
            validatedData.student_password,
            validatedData.student_first_name,
            validatedData.student_last_name,
            "student"
          );

          if (!studentClerkUser.clerkId) {
            throw new Error(
              "Failed to create student in authentication system"
            );
          }

          // Find or create class and grade
          const gradeLevel = parseInt(validatedData.student_grade);
          const classId = await findOrCreateClass(
            validatedData.student_class,
            gradeLevel
          );

          const grade = await tx.grade.findUnique({
            where: { level: gradeLevel },
          });

          if (!grade) {
            throw new Error(`Grade ${gradeLevel} not found`);
          }

          // Create or update student in database
          const studentData = {
            username: generateUsername(validatedData.student_email),
            name: validatedData.student_first_name,
            surname: validatedData.student_last_name,
            email: validatedData.student_email,
            phone: validatedData.student_phone,
            address: validatedData.address,
            sex: validatedData.student_sex,
            birthday: new Date(validatedData.student_birthday),
            gradeId: grade.id,
            classId: classId,
            parentId: parent.id,
          };

          if (studentClerkUser.isNew) {
            await tx.student.create({
              data: {
                id: studentClerkUser.clerkId,
                ...studentData,
              },
            });
          } else {
            await tx.student.upsert({
              where: { id: studentClerkUser.clerkId },
              update: studentData,
              create: {
                id: studentClerkUser.clerkId,
                ...studentData,
              },
            });
          }
        });

        result.successfulImports++;
      } catch (error: any) {
        console.error(`Error processing row ${rowNumber}:`, {
          error: error.message,
          record: record,
          stack: error.stack,
        });
        result.errors.push({
          row: rowNumber,
          data: record,
          error: error.message || "Unknown error occurred",
        });
      }
    }
  } catch (error: any) {
    console.error("Error processing data:", error);
    result.success = false;
    result.errors.push({
      row: 0,
      data: {},
      error: `Data processing failed: ${error.message}`,
    });
  }

  return result;
}

// Process teachers data (from Excel)
async function processTeachersData(
  records: any[],
  fileType: string,
  syncMode: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    totalRows: 0,
    successfulImports: 0,
    deletedUsers: {
      students: 0,
      parents: 0,
      teachers: 0,
    },
    errors: [],
    skipped: [],
  };

  try {
    result.totalRows = records.length;

    // Handle sync mode - delete teachers not in Excel
    if (syncMode) {
      console.log("Sync mode enabled - checking for teachers to delete...");

      // Get emails from Excel file
      const excelEmails = new Set<string>();
      records.forEach((record) => {
        if (record.teacher_email)
          excelEmails.add(record.teacher_email.toLowerCase());
      });

      // Find teachers to delete
      const usersToDelete = await findUsersToDelete(excelEmails, "teachers");

      // Delete teachers not in Excel
      for (const teacherId of usersToDelete.teachersToDelete) {
        await deleteUserFromClerkAndDatabase(teacherId, "teacher");
        result.deletedUsers!.teachers++;
      }

      console.log(
        `Sync cleanup: Deleted ${result.deletedUsers!.teachers} teachers`
      );
    }

    // Pre-validate all data
    const validationResults = validateExcelData(records, "teachers");
    console.log("Validation Summary:", validationResults.summary);

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // Adding 2 because: 1-based indexing + header row
      const record = records[i];

      try {
        // Check if this row had validation errors
        const rowValidation = validationResults.results[i];
        if (!rowValidation.isValid) {
          const errorMessages = rowValidation.errors
            .map((e: any) => e.message)
            .join("; ");
          throw new Error(`Validation failed: ${errorMessages}`);
        }

        // Validate row data with Zod schema
        const validatedData = excelTeacherSchema.parse(record);

        // Start transaction for this row
        await prisma.$transaction(async (tx) => {
          // Create or update teacher in Clerk
          const teacherClerkUser = await createOrUpdateClerkUser(
            validatedData.teacher_email,
            validatedData.teacher_password,
            validatedData.teacher_first_name,
            validatedData.teacher_last_name,
            "teacher"
          );

          if (!teacherClerkUser.clerkId) {
            throw new Error(
              "Failed to create teacher in authentication system"
            );
          }

          // Process subjects if provided
          let subjectIds: number[] = [];
          if (validatedData.subjects && validatedData.subjects.trim()) {
            const subjectNames = validatedData.subjects
              .split(",")
              .map((s: string) => s.trim());
            subjectIds = await findSubjectsByNames(subjectNames);
          }

          // Create or update teacher in database
          const teacherData = {
            username: generateUsername(validatedData.teacher_email),
            name: validatedData.teacher_first_name,
            surname: validatedData.teacher_last_name,
            email: validatedData.teacher_email,
            phone: validatedData.teacher_phone,
            address: validatedData.address,
            sex: validatedData.teacher_sex,
            birthday: new Date(validatedData.teacher_birthday),
          };

          if (teacherClerkUser.isNew) {
            await tx.teacher.create({
              data: {
                id: teacherClerkUser.clerkId,
                ...teacherData,
                subjects: {
                  connect: subjectIds.map((id) => ({ id })),
                },
              },
            });
          } else {
            await tx.teacher.upsert({
              where: { id: teacherClerkUser.clerkId },
              update: {
                ...teacherData,
                subjects: {
                  set: subjectIds.map((id) => ({ id })),
                },
              },
              create: {
                id: teacherClerkUser.clerkId,
                ...teacherData,
                subjects: {
                  connect: subjectIds.map((id) => ({ id })),
                },
              },
            });
          }
        });

        result.successfulImports++;
      } catch (error: any) {
        console.error(`Error processing row ${rowNumber}:`, {
          error: error.message,
          record: record,
          stack: error.stack,
        });
        result.errors.push({
          row: rowNumber,
          data: record,
          error: error.message || "Unknown error occurred",
        });
      }
    }
  } catch (error: any) {
    console.error("Error processing data:", error);
    result.success = false;
    result.errors.push({
      row: 0,
      data: {},
      error: `Data processing failed: ${error.message}`,
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await clerkClient.users.getUser(userId);
    if (user.publicMetadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const importType = formData.get("type") as string;
    const syncMode = formData.get("syncMode") === "true"; // New sync mode option

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!importType || !["students-parents", "teachers"].includes(importType)) {
      return NextResponse.json(
        { error: "Invalid import type" },
        { status: 400 }
      );
    }

    // Check file type - only supporting Excel now
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        {
          error: "Only Excel files (.xlsx, .xls) are allowed",
        },
        { status: 400 }
      );
    }

    // Parse Excel file content
    const records = await parseFile(file);

    // Add debugging information
    debugExcelData(records, importType as "students-parents" | "teachers");

    let result: ImportResult;
    const fileType = "Excel";

    if (importType === "students-parents") {
      result = await processStudentsParentsData(records, fileType, syncMode);
    } else {
      result = await processTeachersData(records, fileType, syncMode);
    }

    // Return result
    return NextResponse.json({
      success: result.success,
      message: `Import completed. ${result.successfulImports} out of ${
        result.totalRows
      } records processed successfully.${
        result.deletedUsers
          ? ` Deleted: ${result.deletedUsers.students} students, ${result.deletedUsers.parents} parents, ${result.deletedUsers.teachers} teachers.`
          : ""
      }`,
      data: {
        totalRows: result.totalRows,
        successfulImports: result.successfulImports,
        deletedUsers: result.deletedUsers,
        errors: result.errors,
        skipped: result.skipped,
      },
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: `Import failed: ${error.message}` },
      { status: 500 }
    );
  }
}
