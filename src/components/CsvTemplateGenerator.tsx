"use client";

import { Download, FileText, Users, GraduationCap } from "lucide-react";
import * as XLSX from "xlsx";

const CsvTemplateGenerator = () => {
  const handleDownload = (type: "students-parents" | "teachers") => {
    if (type === "students-parents") {
      downloadStudentsParentsTemplate();
    } else {
      downloadTeachersTemplate();
    }
  };

  const downloadStudentsParentsTemplate = () => {
    const templateData = [
      {
        student_email: "john.doe@example.com",
        student_password: "password123",
        student_first_name: "John",
        student_last_name: "Doe",
        student_phone: "1234567890",
        student_birthday: "2010-01-15",
        student_class: "A",
        student_grade: "5",
        student_sex: "MALE",
        address: "123 Main St",
        parent_email: "parent@example.com",
        parent_password: "password123",
        parent_first_name: "Jane",
        parent_last_name: "Doe",
        parent_phone: "0987654321",
        parent_birthday: "1985-03-20",
        parent_sex: "FEMALE",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students_Parents");
    XLSX.writeFile(workbook, "students_parents_template.xlsx");
  };

  const downloadTeachersTemplate = () => {
    const templateData = [
      {
        teacher_email: "teacher@example.com",
        teacher_password: "password123",
        teacher_first_name: "Alice",
        teacher_last_name: "Smith",
        teacher_phone: "1234567890",
        teacher_birthday: "1990-05-15",
        teacher_sex: "FEMALE",
        address: "456 Oak Ave",
        subjects: "Math,Science",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, "teachers_template.xlsx");
  };
  const studentsParentsFields = [
    {
      field: "student_email",
      type: "email",
      required: true,
      example: "john.doe@example.com",
    },
    {
      field: "student_password",
      type: "text",
      required: true,
      example: "password123",
    },
    {
      field: "student_first_name",
      type: "text",
      required: true,
      example: "John",
    },
    {
      field: "student_last_name",
      type: "text",
      required: true,
      example: "Doe",
    },
    {
      field: "student_phone",
      type: "text",
      required: false,
      example: "1234567890",
    },
    {
      field: "student_birthday",
      type: "date",
      required: true,
      example: "2010-01-15",
    },
    { field: "student_class", type: "text", required: true, example: "A" },
    { field: "student_grade", type: "number", required: true, example: "5" },
    { field: "student_sex", type: "enum", required: true, example: "MALE" },
    { field: "address", type: "text", required: true, example: "123 Main St" },
    {
      field: "parent_email",
      type: "email",
      required: true,
      example: "parent@example.com",
    },
    {
      field: "parent_password",
      type: "text",
      required: true,
      example: "password123",
    },
    {
      field: "parent_first_name",
      type: "text",
      required: true,
      example: "Jane",
    },
    { field: "parent_last_name", type: "text", required: true, example: "Doe" },
    {
      field: "parent_phone",
      type: "text",
      required: true,
      example: "0987654321",
    },
    {
      field: "parent_birthday",
      type: "date",
      required: true,
      example: "1985-03-20",
    },
    { field: "parent_sex", type: "enum", required: true, example: "FEMALE" },
  ];

  const teachersFields = [
    {
      field: "teacher_email",
      type: "email",
      required: true,
      example: "teacher@example.com",
    },
    {
      field: "teacher_password",
      type: "text",
      required: true,
      example: "password123",
    },
    {
      field: "teacher_first_name",
      type: "text",
      required: true,
      example: "Alice",
    },
    {
      field: "teacher_last_name",
      type: "text",
      required: true,
      example: "Smith",
    },
    {
      field: "teacher_phone",
      type: "text",
      required: false,
      example: "1234567890",
    },
    {
      field: "teacher_birthday",
      type: "date",
      required: true,
      example: "1990-05-15",
    },
    { field: "teacher_sex", type: "enum", required: true, example: "FEMALE" },
    { field: "address", type: "text", required: true, example: "456 Oak Ave" },
    {
      field: "subjects",
      type: "text",
      required: false,
      example: "Math,Science",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return "📧";
      case "date":
        return "📅";
      case "number":
        return "🔢";
      case "enum":
        return "⭐";
      default:
        return "📝";
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students + Parents Template */}
        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Students + Parents
                </h3>
                <p className="text-sm text-blue-600">
                  {studentsParentsFields.length} fields
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload("students-parents")}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {studentsParentsFields.map((field, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTypeIcon(field.type)}</span>
                  <span className="text-sm font-medium text-blue-800">
                    {field.field}
                  </span>
                  {field.required && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <span className="text-xs text-blue-600">{field.example}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teachers Template */}
        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-2">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Teachers
                </h3>
                <p className="text-sm text-green-600">
                  {teachersFields.length} fields
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDownload("teachers")}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {teachersFields.map((field, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTypeIcon(field.type)}</span>
                  <span className="text-sm font-medium text-green-800">
                    {field.field}
                  </span>
                  {field.required && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <span className="text-xs text-green-600">{field.example}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field Type Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Field Type Legend
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <span>📝</span>
            <span className="text-gray-600">Text</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📧</span>
            <span className="text-gray-600">Email</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📅</span>
            <span className="text-gray-600">Date (YYYY-MM-DD)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔢</span>
            <span className="text-gray-600">Number</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⭐</span>
            <span className="text-gray-600">MALE/FEMALE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvTemplateGenerator;
