// Utility functions for Excel import validation and processing

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ExcelValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Enhanced email validation for Clerk compatibility
export function validateEmailFormat(email: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email || typeof email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
    return errors;
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic email regex that's compatible with Clerk
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    errors.push({
      field: "email",
      message: "Invalid email format",
      value: email,
    });
  }

  if (trimmedEmail.length > 254) {
    errors.push({
      field: "email",
      message: "Email is too long (max 254 characters)",
      value: email,
    });
  }

  // Check for consecutive dots
  if (trimmedEmail.includes("..")) {
    errors.push({
      field: "email",
      message: "Email contains consecutive dots",
      value: email,
    });
  }

  return errors;
}

// Enhanced password validation for Clerk compatibility
export function validatePasswordFormat(password: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!password || typeof password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
    return errors;
  }

  if (password.length < 8) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters long",
    });
  }

  if (password.length > 128) {
    errors.push({
      field: "password",
      message: "Password is too long (max 128 characters)",
    });
  }

  // Check for spaces (may cause issues with Clerk)
  if (password.includes(" ")) {
    errors.push({
      field: "password",
      message: "Password should not contain spaces",
    });
  }

  return errors;
}

// Enhanced name validation for Clerk compatibility
export function validateNameFormat(
  name: string,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!name || typeof name !== "string") {
    errors.push({ field: fieldName, message: `${fieldName} is required` });
    return errors;
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    errors.push({ field: fieldName, message: `${fieldName} cannot be empty` });
  }

  if (trimmedName.length > 50) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is too long (max 50 characters)`,
      value: name,
    });
  }

  // Check for invalid characters that might cause Clerk issues
  const nameRegex =
    /^[a-zA-Z\s\-'\.àáâäãåąčćđèéêëęìíîïłńòóôöõøùúûüųśşßÿźžñç]+$/;
  if (!nameRegex.test(trimmedName)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} contains invalid characters`,
      value: name,
    });
  }

  return errors;
}

// Validate date format (YYYY-MM-DD)
export function validateDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateString
  );
}

// Validate phone number format (basic validation)
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || phone.trim() === "") return true; // Optional field
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// Validate grade level
export function validateGradeLevel(grade: string): boolean {
  const gradeNum = parseInt(grade);
  return !isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 12;
}

// Validate class name format
export function validateClassName(className: string): boolean {
  if (!className || typeof className !== "string") return false;
  const classRegex = /^[1-9][0-9]?[A-Z]$/; // Like 5A, 10B, etc.
  return classRegex.test(className.toUpperCase());
}

// Generate validation report for student+parent row
export function validateStudentParentRow(
  row: any,
  rowNumber: number
): ExcelValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Ensure row is not null/undefined
  if (!row || typeof row !== "object") {
    errors.push({ field: "row", message: "Invalid row data" });
    return { isValid: false, errors, warnings };
  }

  // Student validations with enhanced checks
  errors.push(
    ...validateEmailFormat(row.student_email).map((e) => ({
      ...e,
      field: "student_email",
    }))
  );
  errors.push(
    ...validatePasswordFormat(row.student_password).map((e) => ({
      ...e,
      field: "student_password",
    }))
  );
  errors.push(
    ...validateNameFormat(row.student_first_name, "student_first_name")
  );
  errors.push(
    ...validateNameFormat(row.student_last_name, "student_last_name")
  );

  if (!validateDateFormat(row.student_birthday)) {
    errors.push({
      field: "student_birthday",
      message: "Student birthday must be in YYYY-MM-DD format",
      value: row.student_birthday,
    });
  }

  if (!["MALE", "FEMALE"].includes((row.student_sex || "").toUpperCase())) {
    errors.push({
      field: "student_sex",
      message: "Student sex must be MALE or FEMALE",
      value: row.student_sex,
    });
  }

  if (!validateGradeLevel(row.student_grade)) {
    errors.push({
      field: "student_grade",
      message: "Grade must be a number between 1 and 12",
      value: row.student_grade,
    });
  }

  if (!validateClassName(row.student_class)) {
    warnings.push(
      `Class name "${row.student_class}" doesn't follow standard format (e.g., 5A, 10B). It will be created as-is.`
    );
  }

  if (row.student_phone && !validatePhoneNumber(row.student_phone)) {
    warnings.push(
      `Student phone number "${row.student_phone}" may not be in a valid format.`
    );
  }

  // Parent validations with enhanced checks
  errors.push(
    ...validateEmailFormat(row.parent_email).map((e) => ({
      ...e,
      field: "parent_email",
    }))
  );
  errors.push(
    ...validatePasswordFormat(row.parent_password).map((e) => ({
      ...e,
      field: "parent_password",
    }))
  );
  errors.push(
    ...validateNameFormat(row.parent_first_name, "parent_first_name")
  );
  errors.push(...validateNameFormat(row.parent_last_name, "parent_last_name"));

  if (!validateDateFormat(row.parent_birthday)) {
    errors.push({
      field: "parent_birthday",
      message: "Parent birthday must be in YYYY-MM-DD format",
      value: row.parent_birthday,
    });
  }

  if (!["MALE", "FEMALE"].includes((row.parent_sex || "").toUpperCase())) {
    errors.push({
      field: "parent_sex",
      message: "Parent sex must be MALE or FEMALE",
      value: row.parent_sex,
    });
  }

  if (!row.parent_phone || row.parent_phone.trim() === "") {
    errors.push({ field: "parent_phone", message: "Parent phone is required" });
  } else if (!validatePhoneNumber(row.parent_phone)) {
    warnings.push(
      `Parent phone number "${row.parent_phone}" may not be in a valid format.`
    );
  }

  // Shared validations
  if (!row.address || row.address.trim() === "") {
    errors.push({ field: "address", message: "Address is required" });
  }

  // Check for duplicate emails
  if (
    row.student_email &&
    row.parent_email &&
    row.student_email.trim().toLowerCase() ===
      row.parent_email.trim().toLowerCase()
  ) {
    errors.push({
      field: "parent_email",
      message: "Student and parent must have different email addresses",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Generate validation report for teacher row
export function validateTeacherRow(
  row: any,
  rowNumber: number
): ExcelValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Ensure row is not null/undefined
  if (!row || typeof row !== "object") {
    errors.push({ field: "row", message: "Invalid row data" });
    return { isValid: false, errors, warnings };
  }

  // Enhanced teacher validations
  errors.push(
    ...validateEmailFormat(row.teacher_email).map((e) => ({
      ...e,
      field: "teacher_email",
    }))
  );
  errors.push(
    ...validatePasswordFormat(row.teacher_password).map((e) => ({
      ...e,
      field: "teacher_password",
    }))
  );
  errors.push(
    ...validateNameFormat(row.teacher_first_name, "teacher_first_name")
  );
  errors.push(
    ...validateNameFormat(row.teacher_last_name, "teacher_last_name")
  );

  if (!validateDateFormat(row.teacher_birthday)) {
    errors.push({
      field: "teacher_birthday",
      message: "Teacher birthday must be in YYYY-MM-DD format",
      value: row.teacher_birthday,
    });
  }

  if (!["MALE", "FEMALE"].includes((row.teacher_sex || "").toUpperCase())) {
    errors.push({
      field: "teacher_sex",
      message: "Teacher sex must be MALE or FEMALE",
      value: row.teacher_sex,
    });
  }

  if (!row.address || row.address.trim() === "") {
    errors.push({ field: "address", message: "Address is required" });
  }

  if (row.teacher_phone && !validatePhoneNumber(row.teacher_phone)) {
    warnings.push(
      `Teacher phone number "${row.teacher_phone}" may not be in a valid format.`
    );
  }

  if (row.subjects && row.subjects.trim()) {
    const subjects = row.subjects.split(",").map((s: string) => s.trim());
    if (subjects.some((s: string) => s.length === 0)) {
      warnings.push(
        "Some subject names are empty. Check comma-separated subject list."
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Batch validate Excel data before processing
export function validateExcelData(
  data: any[],
  type: "students-parents" | "teachers"
) {
  const results = data.map((row, index) => {
    const rowNumber = index + 2; // Account for header row
    return {
      rowNumber,
      ...(type === "students-parents"
        ? validateStudentParentRow(row, rowNumber)
        : validateTeacherRow(row, rowNumber)),
    };
  });

  const totalErrors = results.reduce(
    (sum, result) => sum + result.errors.length,
    0
  );
  const totalWarnings = results.reduce(
    (sum, result) => sum + result.warnings.length,
    0
  );
  const validRows = results.filter((result) => result.isValid).length;

  return {
    results,
    summary: {
      totalRows: data.length,
      validRows,
      invalidRows: data.length - validRows,
      totalErrors,
      totalWarnings,
    },
  };
}

// Debug function for Excel data
export function debugExcelData(
  records: any[],
  type: "students-parents" | "teachers"
): void {
  console.log("=== EXCEL DEBUG INFO ===");
  console.log(`Import Type: ${type}`);
  console.log(`Total Records: ${records.length}`);

  if (records.length > 0) {
    const firstRecord = records[0];
    const headers = Object.keys(firstRecord);
    console.log(`Column Count: ${headers.length}`);
    console.log("Headers:", headers);
    console.log("First Record:", firstRecord);

    // Check for common Excel issues
    const issues = [];

    // Check for empty header names
    const emptyHeaders = headers.filter((h) => !h || h.trim() === "");
    if (emptyHeaders.length > 0) {
      issues.push(`${emptyHeaders.length} empty header(s) found`);
    }

    // Check for column names with numbers (Excel auto-generated)
    const autoHeaders = headers.filter((h) => h.includes("column_"));
    if (autoHeaders.length > 0) {
      issues.push(
        `${
          autoHeaders.length
        } auto-generated column name(s): ${autoHeaders.join(", ")}`
      );
    }

    // Check for date formatting issues
    const dateFields = headers.filter((h) => h.includes("birthday"));
    dateFields.forEach((field) => {
      const value = firstRecord[field];
      if (value && typeof value === "number") {
        issues.push(
          `Date field '${field}' appears to be Excel serial number: ${value}`
        );
      }
    });

    if (issues.length > 0) {
      console.log("Potential Excel Issues:", issues);
    }
  }

  console.log("=== END EXCEL DEBUG ===");
}
