import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "students" or "teachers"

  try {
    if (type === "students") {
      // Create student template with exact Excel column structure
      const studentData = [
        {
          student_email: "john.doe@example.com",
          student_password: "StudentPass123",
          student_first_name: "John",
          student_last_name: "Doe",
          student_phone: "1234567890",
          student_birthday: "2005-01-15",
          student_class: "A",
          student_grade: "11",
          student_sex: "MALE",
          address: "123 Main Street, City, Country",
          parent_email: "jane.doe@example.com",
          parent_password: "ParentPass123",
          parent_first_name: "Jane",
          parent_last_name: "Doe",
          parent_phone: "0987654321",
          parent_birthday: "1980-05-20",
          parent_sex: "FEMALE",
        },
        {
          student_email: "mary.smith@example.com",
          student_password: "StudentPass456",
          student_first_name: "Mary",
          student_last_name: "Smith",
          student_phone: "2345678901",
          student_birthday: "2006-03-10",
          student_class: "B",
          student_grade: "10",
          student_sex: "FEMALE",
          address: "456 Oak Avenue, City, Country",
          parent_email: "bob.smith@example.com",
          parent_password: "ParentPass456",
          parent_first_name: "Bob",
          parent_last_name: "Smith",
          parent_phone: "1987654321",
          parent_birthday: "1975-08-15",
          parent_sex: "MALE",
        },
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(studentData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 25 }, // student_email
        { wch: 15 }, // student_password
        { wch: 15 }, // student_first_name
        { wch: 15 }, // student_last_name
        { wch: 15 }, // student_phone
        { wch: 12 }, // student_birthday
        { wch: 8 },  // student_class
        { wch: 8 },  // student_grade
        { wch: 10 }, // student_sex
        { wch: 30 }, // address
        { wch: 25 }, // parent_email
        { wch: 15 }, // parent_password
        { wch: 15 }, // parent_first_name
        { wch: 15 }, // parent_last_name
        { wch: 15 }, // parent_phone
        { wch: 12 }, // parent_birthday
        { wch: 10 }, // parent_sex
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=student_import_template.xlsx",
        },
      });

    } else if (type === "teachers") {
      // Create teacher template with exact Excel column structure
      const teacherData = [
        {
          teacher_email: "alice.johnson@school.edu",
          teacher_password: "TeacherPass123",
          teacher_first_name: "Alice",
          teacher_last_name: "Johnson",
          teacher_phone: "3456789012",
          teacher_birthday: "1985-07-12",
          teacher_sex: "FEMALE",
          address: "789 Pine Street, City, Country",
          subjects: "Mathematics,Physics", // Comma-separated
        },
        {
          teacher_email: "david.wilson@school.edu",
          teacher_password: "TeacherPass456",
          teacher_first_name: "David",
          teacher_last_name: "Wilson",
          teacher_phone: "4567890123",
          teacher_birthday: "1978-11-25",
          teacher_sex: "MALE",
          address: "321 Elm Road, City, Country",
          subjects: "English,Literature",
        },
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(teacherData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 25 }, // teacher_email
        { wch: 15 }, // teacher_password
        { wch: 15 }, // teacher_first_name
        { wch: 15 }, // teacher_last_name
        { wch: 15 }, // teacher_phone
        { wch: 12 }, // teacher_birthday
        { wch: 10 }, // teacher_sex
        { wch: 30 }, // address
        { wch: 25 }, // subjects
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=teacher_import_template.xlsx",
        },
      });

    } else {
      return NextResponse.json({ error: "Invalid type. Use 'students' or 'teachers'" }, { status: 400 });
    }

  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
