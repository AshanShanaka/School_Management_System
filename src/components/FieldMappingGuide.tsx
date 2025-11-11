"use client";

import { useState } from "react";

interface FieldMapping {
  excelColumn: string;
  formField: string;
  description: string;
  required: boolean;
  example: string;
}

const FieldMappingGuide = ({ type }: { type: "students" | "teachers" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const studentFields: FieldMapping[] = [
    {
      excelColumn: "student_email",
      formField: "Student Email",
      description: "Student's email address for login",
      required: true,
      example: "john.doe@example.com"
    },
    {
      excelColumn: "student_password",
      formField: "Student Password",
      description: "Student's login password",
      required: true,
      example: "StudentPass123"
    },
    {
      excelColumn: "student_first_name",
      formField: "Student First Name",
      description: "Student's first name",
      required: true,
      example: "John"
    },
    {
      excelColumn: "student_last_name",
      formField: "Student Last Name",
      description: "Student's last name",
      required: true,
      example: "Doe"
    },
    {
      excelColumn: "student_phone",
      formField: "Student Phone",
      description: "Student's phone number",
      required: false,
      example: "1234567890"
    },
    {
      excelColumn: "student_birthday",
      formField: "Student Birthday",
      description: "Student's date of birth (YYYY-MM-DD)",
      required: true,
      example: "2005-01-15"
    },
    {
      excelColumn: "student_class",
      formField: "Student Class",
      description: "Class section (A, B, C, etc.)",
      required: true,
      example: "A"
    },
    {
      excelColumn: "student_grade",
      formField: "Student Grade",
      description: "Grade level (9, 10, 11, 12, etc.)",
      required: true,
      example: "11"
    },
    {
      excelColumn: "student_sex",
      formField: "Student Sex",
      description: "Student's gender (MALE/FEMALE or M/F)",
      required: true,
      example: "MALE"
    },
    {
      excelColumn: "address",
      formField: "Address",
      description: "Shared address for student and parent",
      required: true,
      example: "123 Main Street, City, Country"
    },
    {
      excelColumn: "parent_email",
      formField: "Parent Email",
      description: "Parent's email address for login",
      required: true,
      example: "jane.doe@example.com"
    },
    {
      excelColumn: "parent_password",
      formField: "Parent Password",
      description: "Parent's login password",
      required: true,
      example: "ParentPass123"
    },
    {
      excelColumn: "parent_first_name",
      formField: "Parent First Name",
      description: "Parent's first name",
      required: true,
      example: "Jane"
    },
    {
      excelColumn: "parent_last_name",
      formField: "Parent Last Name",
      description: "Parent's last name",
      required: true,
      example: "Doe"
    },
    {
      excelColumn: "parent_phone",
      formField: "Parent Phone",
      description: "Parent's phone number",
      required: true,
      example: "0987654321"
    },
    {
      excelColumn: "parent_birthday",
      formField: "Parent Birthday",
      description: "Parent's date of birth (YYYY-MM-DD)",
      required: true,
      example: "1980-05-20"
    },
    {
      excelColumn: "parent_sex",
      formField: "Parent Sex",
      description: "Parent's gender (MALE/FEMALE or M/F)",
      required: true,
      example: "FEMALE"
    }
  ];

  const teacherFields: FieldMapping[] = [
    {
      excelColumn: "teacher_email",
      formField: "Teacher Email",
      description: "Teacher's email address for login",
      required: true,
      example: "alice.johnson@school.edu"
    },
    {
      excelColumn: "teacher_password",
      formField: "Teacher Password",
      description: "Teacher's login password",
      required: true,
      example: "TeacherPass123"
    },
    {
      excelColumn: "teacher_first_name",
      formField: "Teacher First Name",
      description: "Teacher's first name",
      required: true,
      example: "Alice"
    },
    {
      excelColumn: "teacher_last_name",
      formField: "Teacher Last Name",
      description: "Teacher's last name",
      required: true,
      example: "Johnson"
    },
    {
      excelColumn: "teacher_phone",
      formField: "Teacher Phone",
      description: "Teacher's phone number",
      required: false,
      example: "3456789012"
    },
    {
      excelColumn: "teacher_birthday",
      formField: "Teacher Birthday",
      description: "Teacher's date of birth (YYYY-MM-DD)",
      required: true,
      example: "1985-07-12"
    },
    {
      excelColumn: "teacher_sex",
      formField: "Teacher Sex",
      description: "Teacher's gender (MALE/FEMALE or M/F)",
      required: true,
      example: "FEMALE"
    },
    {
      excelColumn: "address",
      formField: "Address",
      description: "Teacher's address",
      required: true,
      example: "789 Pine Street, City, Country"
    },
    {
      excelColumn: "subjects",
      formField: "Subjects",
      description: "Comma-separated list of subject names",
      required: false,
      example: "Mathematics,Physics"
    }
  ];

  const fields = type === "students" ? studentFields : teacherFields;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-800">
          📋 Field Mapping Guide - {type === "students" ? "Students & Parents" : "Teachers"}
        </h3>
        <span className="text-2xl text-gray-500">
          {isExpanded ? "−" : "+"}
        </span>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-4">
            The form fields below correspond exactly to the Excel column headers. 
            Use the template download to ensure proper formatting.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                    Excel Column
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                    Form Field
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                    Description
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    Required
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border border-gray-300 px-3 py-2 font-mono text-sm">
                      {field.excelColumn}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {field.formField}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {field.description}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        field.required 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {field.required ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-mono text-sm text-gray-600">
                      {field.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Important Notes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use the exact column headers shown in the "Excel Column" column</li>
              <li>• Date format must be YYYY-MM-DD (e.g., 2005-01-15)</li>
              <li>• Sex field accepts: MALE, FEMALE, M, or F</li>
              {type === "teachers" && (
                <li>• Subjects should be comma-separated (e.g., "Mathematics,Physics")</li>
              )}
              {type === "students" && (
                <li>• Each row creates both a student and their parent automatically</li>
              )}
              <li>• Download the template for proper formatting</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldMappingGuide;
