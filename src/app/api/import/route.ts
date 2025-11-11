import { NextRequest, NextResponse } from "next/server";
import { requireAuth, hashPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import {
  excelStudentParentSchema,
  excelTeacherSchema,
} from "@/lib/formValidationSchemas";

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

// Helper function to generate username from email
function generateUsername(email: string): string {
  const baseUsername = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 15);

  if (!/^[a-z]/.test(baseUsername)) {
    return `user${baseUsername}`;
  }

  return baseUsername;
}

// Helper function to generate secure password
function generateSecurePassword(originalPassword?: string): string {
  if (originalPassword && originalPassword.length >= 8) {
    return originalPassword;
  }

  // Generate a secure password
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper function to check for conflicts
async function checkExistingUser(
  email: string,
  username: string
): Promise<{ hasConflict: boolean; existingRole?: string }> {
  try {
    // Check all user tables for conflicts
    const [existingTeacher, existingParent, existingStudent] =
      await Promise.all([
        prisma.teacher.findFirst({
          where: {
            OR: [{ email }, { username }],
          },
        }),
        prisma.parent.findFirst({
          where: {
            OR: [{ email }, { username }],
          },
        }),
        prisma.student.findFirst({
          where: {
            OR: [{ email }, { username }],
          },
        }),
      ]);

    let existingRole: string | undefined = undefined;

    if (existingTeacher) existingRole = "teacher";
    else if (existingParent) existingRole = "parent";
    else if (existingStudent) existingRole = "student";

    return {
      hasConflict: !!existingRole,
      existingRole,
    };
  } catch (error) {
    console.error("Error checking existing user:", error);
    return { hasConflict: false };
  }
}

// Process teacher data
async function processTeacherData(
  data: any[],
  clearExisting: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    totalRows: data.length,
    successfulImports: 0,
    errors: [],
    skipped: [],
    deletedUsers: { students: 0, parents: 0, teachers: 0 },
  };

  // Clear existing teachers if requested
  if (clearExisting) {
    const deletedTeachers = await prisma.teacher.deleteMany({});
    result.deletedUsers!.teachers = deletedTeachers.count;
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // Excel row (1-indexed + header)

    try {
      // Debug: Log the raw row data
      console.log(`Processing teacher row ${rowNumber}:`, row);

      // Validate data with better error handling
      const validatedData = excelTeacherSchema.parse(row);

      console.log(`Validated data for row ${rowNumber}:`, {
        teacher_email: validatedData.teacher_email,
        teacher_birthday: validatedData.teacher_birthday,
      });

      const email = validatedData.teacher_email;
      const username = generateUsername(email);
      const password = generateSecurePassword(validatedData.teacher_password);
      const hashedPassword = await hashPassword(password);

      // Check for conflicts
      const conflict = await checkExistingUser(email, username);
      if (conflict.hasConflict && !clearExisting) {
        result.skipped.push({
          row: rowNumber,
          data: row,
          reason: `User already exists as ${conflict.existingRole}`,
        });
        continue;
      }

      // Parse and validate birthday
      let birthday: Date;
      try {
        birthday = new Date(validatedData.teacher_birthday);
        if (isNaN(birthday.getTime())) {
          throw new Error("Invalid birthday format");
        }
      } catch (dateError) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: `Invalid teacher birthday format: ${validatedData.teacher_birthday}`,
        });
        continue;
      }

      // Process subjects (comma-separated subject names)
      let subjectConnections: { name: string }[] = [];
      if (validatedData.subjects && validatedData.subjects.trim() !== "") {
        const subjectNames = validatedData.subjects
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        // Find or create subjects
        for (const subjectName of subjectNames) {
          try {
            // Try to find existing subject
            let subject = await prisma.subject.findFirst({
              where: { name: subjectName },
            });

            // Create subject if it doesn't exist
            if (!subject) {
              subject = await prisma.subject.create({
                data: { name: subjectName },
              });
              console.log(`Created new subject: ${subjectName}`);
            }

            subjectConnections.push({ name: subjectName });
          } catch (subjectError) {
            console.error(`Error processing subject ${subjectName}:`, subjectError);
            // Continue with other subjects even if one fails
          }
        }
      }

      // Create teacher in database with subject connections
      await prisma.teacher.create({
        data: {
          username,
          name: validatedData.teacher_first_name,
          surname: validatedData.teacher_last_name,
          email,
          password: hashedPassword,
          phone: validatedData.teacher_phone,
          address: validatedData.address,
          sex: validatedData.teacher_sex as any,
          birthday: birthday,
          subjects: {
            connect: subjectConnections,
          },
        },
      });

      console.log(`Successfully processed teacher row ${rowNumber} with ${subjectConnections.length} subject(s)`);
      result.successfulImports++;
    } catch (error: any) {
      console.error(`Error processing teacher row ${rowNumber}:`, error);

      // Parse Zod errors for better user feedback
      if (error.name === "ZodError") {
        const zodErrorMessage = error.issues
          .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");

        result.errors.push({
          row: rowNumber,
          data: row,
          error: `Validation failed: ${zodErrorMessage}`,
        });
      } else {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error.message || "Unknown error occurred",
        });
      }
    }
  }

  return result;
}

// Process student data
async function processStudentData(
  data: any[],
  clearExisting: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    totalRows: data.length,
    successfulImports: 0,
    errors: [],
    skipped: [],
    deletedUsers: { students: 0, parents: 0, teachers: 0 },
  };

  // Clear existing students and parents if requested
  if (clearExisting) {
    const deletedStudents = await prisma.student.deleteMany({});
    const deletedParents = await prisma.parent.deleteMany({});
    result.deletedUsers!.students = deletedStudents.count;
    result.deletedUsers!.parents = deletedParents.count;
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;

    try {
      // Debug: Log the raw row data
      console.log(`Processing student row ${rowNumber}:`, row);

      // Validate data with better error handling
      const validatedData = excelStudentParentSchema.parse(row);

      console.log(`Validated data for row ${rowNumber}:`, {
        student_email: validatedData.student_email,
        student_birthday: validatedData.student_birthday,
        student_grade: validatedData.student_grade,
        parent_birthday: validatedData.parent_birthday,
      });

      const studentEmail = validatedData.student_email;
      const studentUsername = generateUsername(studentEmail);
      const studentPassword = generateSecurePassword(
        validatedData.student_password
      );
      const studentHashedPassword = await hashPassword(studentPassword);

      const parentEmail = validatedData.parent_email;
      const parentUsername = generateUsername(parentEmail);
      const parentPassword = generateSecurePassword(
        validatedData.parent_password
      );
      const parentHashedPassword = await hashPassword(parentPassword);

      // Check for conflicts
      const studentConflict = await checkExistingUser(
        studentEmail,
        studentUsername
      );
      const parentConflict = await checkExistingUser(
        parentEmail,
        parentUsername
      );

      if (
        (studentConflict.hasConflict || parentConflict.hasConflict) &&
        !clearExisting
      ) {
        result.skipped.push({
          row: rowNumber,
          data: row,
          reason: `User conflicts detected`,
        });
        continue;
      }

      // Create combined class name (e.g., "11-A")
      const gradeLevel = Number(validatedData.student_grade);
      const combinedClassName = `${gradeLevel}-${validatedData.student_class}`;

      // Find class by combined name first, then try original name
      let classRecord = await prisma.class.findFirst({
        where: {
          OR: [
            { name: combinedClassName },
            { name: validatedData.student_class },
          ],
        },
        include: { grade: true },
      });

      if (!classRecord) {
        console.log(`Creating missing class: ${combinedClassName}`);

        // Find or create grade level for new classes
        let gradeRecord = await prisma.grade.findFirst({
          where: { level: gradeLevel },
        });

        if (!gradeRecord) {
          gradeRecord = await prisma.grade.create({
            data: { level: gradeLevel },
          });
        }

        // Create the missing class with combined name
        classRecord = await prisma.class.create({
          data: {
            name: combinedClassName,
            capacity: 25,
            gradeId: gradeRecord.id,
          },
          include: { grade: true },
        });

        console.log(`Created class: ${combinedClassName}`);
      }

      // Parse and validate dates
      let studentBirthday: Date;
      let parentBirthday: Date;

      try {
        studentBirthday = new Date(validatedData.student_birthday);
        if (isNaN(studentBirthday.getTime())) {
          throw new Error("Invalid student birthday format");
        }
      } catch (dateError) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: `Invalid student birthday format: ${validatedData.student_birthday}`,
        });
        continue;
      }

      try {
        parentBirthday = new Date(validatedData.parent_birthday);
        if (isNaN(parentBirthday.getTime())) {
          throw new Error("Invalid parent birthday format");
        }
      } catch (dateError) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: `Invalid parent birthday format: ${validatedData.parent_birthday}`,
        });
        continue;
      }

      // Create parent first
      const parent = await prisma.parent.create({
        data: {
          username: parentUsername,
          name: validatedData.parent_first_name,
          surname: validatedData.parent_last_name,
          email: parentEmail,
          password: parentHashedPassword,
          phone: validatedData.parent_phone!,
          address: validatedData.address,
          sex: validatedData.parent_sex as any,
          birthday: parentBirthday,
        },
      });

      // Create student
      await prisma.student.create({
        data: {
          username: studentUsername,
          name: validatedData.student_first_name,
          surname: validatedData.student_last_name,
          email: studentEmail,
          password: studentHashedPassword,
          phone: validatedData.student_phone,
          address: validatedData.address,
          sex: validatedData.student_sex as any,
          birthday: studentBirthday,
          parentId: parent.id,
          classId: classRecord.id,
          gradeId: classRecord.gradeId,
        },
      });

      console.log(`Successfully processed student row ${rowNumber}`);
      result.successfulImports++;
    } catch (error: any) {
      console.error(`Error processing student row ${rowNumber}:`, error);

      // Parse Zod errors for better user feedback
      if (error.name === "ZodError") {
        const zodErrorMessage = error.issues
          .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");

        result.errors.push({
          row: rowNumber,
          data: row,
          error: `Validation failed: ${zodErrorMessage}`,
        });
      } else {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error.message || "Unknown error occurred",
        });
      }
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  console.log("Import API called"); // Debug log

  try {
    // Check authentication
    const authResult = await requireAuth(request, ["admin"]);
    console.log("Auth result:", authResult); // Debug log

    if (!authResult.user) {
      console.log("Authentication failed:", authResult.error); // Debug log
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", authResult.user.role); // Debug log

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const importType = formData.get("importType") as string;
    const clearExisting = formData.get("clearExisting") === "true";

    console.log("Form data received:", {
      hasFile: !!file,
      importType,
      clearExisting,
      fileSize: file?.size,
      fileName: file?.name,
    }); // Debug log

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!["teachers", "students"].includes(importType)) {
      return NextResponse.json(
        { error: "Invalid import type. Must be 'teachers' or 'students'" },
        { status: 400 }
      );
    }

    console.log("Reading Excel file..."); // Debug log

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log("Excel data parsed:", {
      rowCount: jsonData.length,
      firstRow: jsonData[0],
    }); // Debug log

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "No data found in the Excel file" },
        { status: 400 }
      );
    }

    let result: ImportResult;

    if (importType === "teachers") {
      console.log("Processing teacher data..."); // Debug log
      result = await processTeacherData(jsonData, clearExisting);
    } else {
      console.log("Processing student data..."); // Debug log
      result = await processStudentData(jsonData, clearExisting);
    }

    console.log("Processing complete:", result); // Debug log

    // Determine response status
    const status = result.errors.length > 0 ? 207 : 200; // 207 Multi-Status for partial success

    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error("Import error:", error);
    console.error("Error stack:", error.stack); // Debug log
    return NextResponse.json(
      {
        error: "Import failed",
        details: error.message,
        success: false,
        totalRows: 0,
        successfulImports: 0,
        errors: [],
        skipped: [],
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ["admin"]);
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    // Get import statistics
    const stats = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.parent.count(),
      prisma.class.count(),
      prisma.grade.count(),
    ]);

    return NextResponse.json({
      statistics: {
        teachers: stats[0],
        students: stats[1],
        parents: stats[2],
        classes: stats[3],
        grades: stats[4],
      },
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to get statistics" },
      { status: 500 }
    );
  }
}
