"use client";

import { useState } from "react";
import { toast } from "react-toastify";

interface ImportError {
  row: number;
  data: any;
  error: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    successfulImports: number;
    errors: ImportError[];
    skipped: any[];
  };
}

interface CSVPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

const ExcelImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"students-parents" | "teachers">(
    "students-parents"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);

      // Generate preview only for Excel files
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // For Excel files, show a simpler preview
        setPreview({
          headers: ["Excel file selected - preview not available"],
          rows: [["Click import to process Excel file"]],
          totalRows: 0,
        });
        toast.success(
          "Excel file selected. Preview not available for Excel files."
        );
      } else {
        setPreview(null);
        toast.error("Please select an Excel file (.xlsx or .xls)");
      }
    }
  };

  const validateCSVHeaders = (headers: string[], type: string): boolean => {
    // Excel files don't need header validation as they're processed differently
    return true;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const fileName = file.name.toLowerCase();

    // Only accept Excel files
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", importType);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result: ImportResult = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Import failed");
      }

      setResult(result);

      if (result.success) {
        if (result.data.errors.length > 0) {
          toast.success(
            `Import completed with ${result.data.errors.length} errors. Check details below.`
          );
        } else {
          toast.success(result.message);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Import failed");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = (type: "students-parents" | "teachers") => {
    let headers: string[];
    let sampleRow: string[];

    if (type === "students-parents") {
      headers = [
        "student_email",
        "student_password",
        "student_first_name",
        "student_last_name",
        "student_phone",
        "student_birthday",
        "student_class",
        "student_grade",
        "student_sex",
        "address",
        "parent_email",
        "parent_password",
        "parent_first_name",
        "parent_last_name",
        "parent_phone",
        "parent_birthday",
        "parent_sex",
      ];
      sampleRow = [
        "john.doe@example.com",
        "password123",
        "John",
        "Doe",
        "1234567890",
        "2010-01-15",
        "5A",
        "5",
        "MALE",
        "123 Main St",
        "parent@example.com",
        "password123",
        "Jane",
        "Doe",
        "0987654321",
        "1985-03-20",
        "FEMALE",
      ];
    } else {
      headers = [
        "teacher_email",
        "teacher_password",
        "teacher_first_name",
        "teacher_last_name",
        "teacher_phone",
        "teacher_birthday",
        "teacher_sex",
        "address",
        "subjects",
      ];
      sampleRow = [
        "teacher@example.com",
        "password123",
        "Alice",
        "Smith",
        "1234567890",
        "1990-05-15",
        "FEMALE",
        "456 Oak Ave",
        "Math,Science",
      ];
    }

    // Generate Excel file
    try {
      // Use dynamic import to load xlsx only when needed
      import("xlsx").then((XLSX) => {
        const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${type}-template.xlsx`);
      });
    } catch (error) {
      console.error("Error generating Excel template:", error);
      toast.error("Failed to generate Excel template.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Excel Bulk Import</h2>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTemplate("students-parents")}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Download Students+Parents Template
          </button>
          <button
            onClick={() => downloadTemplate("teachers")}
            className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Download Teachers Template
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Import Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import Type
          </label>
          <select
            value={importType}
            onChange={(e) =>
              setImportType(e.target.value as "students-parents" | "teachers")
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="students-parents">Students + Parents</option>
            <option value="teachers">Teachers</option>
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV or Excel File
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>

        {/* CSV Preview */}
        {preview && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">File Preview</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showPreview ? "Hide" : "Show"} Preview
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Total rows: {preview.totalRows} | Showing first 5 rows
            </p>

            {/* Header validation */}
            <div className="mb-3">
              {validateCSVHeaders(preview.headers, importType) ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ All required columns found
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ✗ Missing required columns
                </span>
              )}
            </div>

            {showPreview && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {preview.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                          >
                            {cell || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={!file || isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Importing..." : "Import File"}
        </button>

        {/* File format note */}
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Supported formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
            <br />
            <strong>Note:</strong> For Excel files, use the first worksheet
            only. Date columns should be formatted as YYYY-MM-DD.
          </p>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Import Results</h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {result.data.totalRows}
              </div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {result.data.successfulImports}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {result.data.errors.length}
              </div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>

          {result.data.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {result.data.errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded text-sm"
                  >
                    <div className="font-medium">Row {error.row}:</div>
                    <div className="text-red-700">{error.error}</div>
                    {error.data.student_email || error.data.teacher_email ? (
                      <div className="text-gray-600 mt-1">
                        Email:{" "}
                        {error.data.student_email || error.data.teacher_email}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelImport;
