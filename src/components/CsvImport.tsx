"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  GraduationCap,
} from "lucide-react";

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
  const [clearExisting, setClearExisting] = useState(false);
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
      // Map the frontend importType to the backend expected value
      const backendImportType =
        importType === "students-parents" ? "students" : "teachers";
      formData.append("importType", backendImportType);
      formData.append("clearExisting", clearExisting.toString());

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || "Import failed");
      }

      // Transform the result to match the expected interface
      const transformedResult: ImportResult = {
        success: result.success !== false,
        message:
          result.success !== false
            ? `Successfully imported ${result.successfulImports} out of ${result.totalRows} records`
            : "Import failed",
        data: {
          totalRows: result.totalRows || 0,
          successfulImports: result.successfulImports || 0,
          errors: result.errors || [],
          skipped: result.skipped || [],
        },
      };

      setResult(transformedResult);

      if (transformedResult.success) {
        if (transformedResult.data.errors.length > 0) {
          toast.success(
            `Import completed with ${transformedResult.data.errors.length} errors. Check details below.`
          );
        } else {
          toast.success(transformedResult.message);
        }
      } else {
        toast.error(transformedResult.message);
      }
    } catch (error: any) {
      console.error("Import error:", error);

      let errorMessage = "Import failed";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(errorMessage);

      // Set error result for display
      setResult({
        success: false,
        message: errorMessage,
        data: {
          totalRows: 0,
          successfulImports: 0,
          errors: [
            {
              row: 0,
              data: {},
              error: errorMessage,
            },
          ],
          skipped: [],
        },
      });
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
      {/* Header with Icon and Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-2">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Bulk Data Import</h2>
            <p className="text-sm text-gray-500">
              Import students, parents, and teachers from Excel files
            </p>
          </div>
        </div>

        {/* Template Download Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => downloadTemplate("students-parents")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <Users className="w-4 h-4" />
            Students + Parents
          </button>
          <button
            onClick={() => downloadTemplate("teachers")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <GraduationCap className="w-4 h-4" />
            Teachers
          </button>
        </div>
      </div>

      {/* Import Configuration */}
      <div className="space-y-6">
        {/* Import Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import Type
            </label>
            <select
              value={importType}
              onChange={(e) =>
                setImportType(e.target.value as "students-parents" | "teachers")
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="students-parents">Students + Parents</option>
              <option value="teachers">Teachers</option>
            </select>
          </div>

          {/* Clear Existing Data Option */}
          <div className="flex items-center h-full">
            <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
              <input
                type="checkbox"
                id="clearExisting"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="clearExisting"
                className="ml-3 block text-sm text-gray-700 font-medium"
              >
                Clear existing data before import
              </label>
            </div>
          </div>
        </div>

        {/* Warning for Clear Existing */}
        {clearExisting && (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Warning: Data Deletion
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This will permanently delete all existing{" "}
                  {importType === "students-parents"
                    ? "students and parents"
                    : "teachers"}{" "}
                  before importing new data. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Select Excel or CSV File
          </label>

          <div className="relative">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-700 mb-2">
                Drop your file here or click to browse
              </div>
              <div className="text-sm text-gray-500">
                Supports Excel (.xlsx, .xls) and CSV (.csv) files
              </div>
            </div>
          </div>

          {file && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    File Selected: {file.name}
                  </p>
                  <p className="text-sm text-green-600">
                    Size: {Math.round(file.size / 1024)} KB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CSV Preview */}
        {preview && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                File Preview
              </h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
              >
                {showPreview ? "Hide" : "Show"} Preview
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                Total rows: {preview.totalRows} | Showing first 5 rows
              </p>

              {/* Header validation */}
              <div>
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
                      <tr
                        key={rowIndex}
                        className={
                          rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
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
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleImport}
            disabled={!file || isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing Import...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Import Data</span>
              </>
            )}
          </button>

          {/* File format note */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">
                  Supported Formats & Guidelines:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Files:</strong> CSV (.csv), Excel (.xlsx, .xls)
                  </li>
                  <li>
                    <strong>Dates:</strong> Use YYYY-MM-DD format (e.g.,
                    2010-01-15)
                  </li>
                  <li>
                    <strong>Sex field:</strong> Must be "MALE" or "FEMALE"
                  </li>
                  <li>
                    <strong>Passwords:</strong> Minimum 8 characters required
                  </li>
                  <li>
                    <strong>Excel:</strong> Data should be in the first
                    worksheet
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 border rounded-xl p-6 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className={`rounded-full p-2 ${
                result.success ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {result.success ? (
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              Import Results
            </h3>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.data.totalRows}
                  </div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="bg-blue-100 rounded-full p-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {result.data.successfulImports}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="bg-green-100 rounded-full p-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {result.data.errors.length}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="bg-red-100 rounded-full p-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Success Rate Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Success Rate
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(
                  (result.data.successfulImports / result.data.totalRows) * 100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (result.data.successfulImports / result.data.totalRows) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Error Details */}
          {result.data.errors.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Import Errors ({result.data.errors.length})
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-3">
                {result.data.errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-red-800">
                        Row {error.row}
                      </div>
                      {error.data.student_email || error.data.teacher_email ? (
                        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {error.data.student_email || error.data.teacher_email}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-red-700">{error.error}</div>
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
