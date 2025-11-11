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
    deletedUsers?: {
      students: number;
      parents: number;
      teachers: number;
    };
    errors: ImportError[];
    skipped: any[];
  };
}

const ExcelImport = () => {
  const [studentsFile, setStudentsFile] = useState<File | null>(null);
  const [teachersFile, setTeachersFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"single" | "dual">("single");
  const [singleFileType, setSingleFileType] = useState<
    "students-parents" | "teachers"
  >("students-parents");
  const [syncMode, setSyncMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleStudentsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setStudentsFile(selectedFile);
      setResult(null);

      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        toast.success("Students+Parents Excel file selected.");
      } else {
        toast.error("Please select an Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleTeachersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setTeachersFile(selectedFile);
      setResult(null);

      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        toast.success("Teachers Excel file selected.");
      } else {
        toast.error("Please select an Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (singleFileType === "students-parents") {
        setStudentsFile(selectedFile);
        setTeachersFile(null);
      } else {
        setTeachersFile(selectedFile);
        setStudentsFile(null);
      }
      setResult(null);

      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        toast.success(`${singleFileType} Excel file selected.`);
      } else {
        toast.error("Please select an Excel file (.xlsx or .xls)");
      }
    }
  };

  const handleImport = async () => {
    // Validation based on import type
    if (importType === "single") {
      const currentFile =
        singleFileType === "students-parents" ? studentsFile : teachersFile;
      if (!currentFile) {
        toast.error("Please select a file");
        return;
      }

      const fileName = currentFile.name.toLowerCase();
      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        return;
      }
    } else {
      // Dual mode - both files required
      if (!studentsFile || !teachersFile) {
        toast.error(
          "Please select both Students+Parents and Teachers Excel files"
        );
        return;
      }

      const studentsFileName = studentsFile.name.toLowerCase();
      const teachersFileName = teachersFile.name.toLowerCase();

      if (
        (!studentsFileName.endsWith(".xlsx") &&
          !studentsFileName.endsWith(".xls")) ||
        (!teachersFileName.endsWith(".xlsx") &&
          !teachersFileName.endsWith(".xls"))
      ) {
        toast.error(
          "Please select Excel files (.xlsx or .xls) for both uploads"
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      if (importType === "single") {
        // Single file import
        const currentFile =
          singleFileType === "students-parents" ? studentsFile : teachersFile;
        const formData = new FormData();
        formData.append("file", currentFile!);
        // Convert "students-parents" to "students" for API compatibility
        const apiType = singleFileType === "students-parents" ? "students" : "teachers";
        formData.append("importType", apiType);
        formData.append("clearExisting", syncMode.toString());

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
      } else {
        // Dual file import - process both files
        setResult(null);

        // Import students+parents first
        const studentsFormData = new FormData();
        studentsFormData.append("file", studentsFile!);
        studentsFormData.append("importType", "students");
        studentsFormData.append("clearExisting", syncMode.toString());

        const studentsResponse = await fetch("/api/import", {
          method: "POST",
          body: studentsFormData,
        });

        const studentsResult: ImportResult = await studentsResponse.json();

        if (!studentsResponse.ok) {
          throw new Error(`Students import failed: ${studentsResult.message}`);
        }

        // Import teachers second
        const teachersFormData = new FormData();
        teachersFormData.append("file", teachersFile!);
        teachersFormData.append("importType", "teachers");
        teachersFormData.append("clearExisting", syncMode.toString());

        const teachersResponse = await fetch("/api/import", {
          method: "POST",
          body: teachersFormData,
        });

        const teachersResult: ImportResult = await teachersResponse.json();

        if (!teachersResponse.ok) {
          throw new Error(`Teachers import failed: ${teachersResult.message}`);
        }

        // Combine results
        const combinedResult: ImportResult = {
          success: studentsResult.success && teachersResult.success,
          message: `Dual import completed: ${studentsResult.data.successfulImports} students/parents, ${teachersResult.data.successfulImports} teachers`,
          data: {
            totalRows:
              studentsResult.data.totalRows + teachersResult.data.totalRows,
            successfulImports:
              studentsResult.data.successfulImports +
              teachersResult.data.successfulImports,
            deletedUsers: {
              students: studentsResult.data.deletedUsers?.students || 0,
              parents: studentsResult.data.deletedUsers?.parents || 0,
              teachers: teachersResult.data.deletedUsers?.teachers || 0,
            },
            errors: [
              ...studentsResult.data.errors,
              ...teachersResult.data.errors,
            ],
            skipped: [
              ...studentsResult.data.skipped,
              ...teachersResult.data.skipped,
            ],
          },
        };

        setResult(combinedResult);

        if (combinedResult.success) {
          if (combinedResult.data.errors.length > 0) {
            toast.success(
              `Dual import completed with ${combinedResult.data.errors.length} errors. Check details below.`
            );
          } else {
            toast.success(combinedResult.message);
          }
        } else {
          toast.warning(
            "Dual import completed with some issues. Check details below."
          );
        }
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
        {/* Import Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import Mode
          </label>
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value as "single" | "dual")}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="single">Single File Import</option>
            <option value="dual">
              Dual File Import (Students+Parents + Teachers)
            </option>
          </select>
        </div>

        {/* Single File Type Selection (only shown in single mode) */}
        {importType === "single" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Type
            </label>
            <select
              value={singleFileType}
              onChange={(e) =>
                setSingleFileType(
                  e.target.value as "students-parents" | "teachers"
                )
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="students-parents">Students + Parents</option>
              <option value="teachers">Teachers</option>
            </select>
          </div>
        )}

        {/* Sync Mode Option */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={syncMode}
              onChange={(e) => setSyncMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Sync Mode (Delete users not in Excel)
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {syncMode
              ? "⚠️ WARNING: Users not in the Excel file will be permanently deleted from both the system and authentication service."
              : "Only add/update users from Excel. Existing users not in Excel will remain unchanged."}
          </p>
        </div>

        {/* File Upload Section */}
        {importType === "single" ? (
          // Single File Upload
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {singleFileType === "students-parents"
                ? "Students+Parents"
                : "Teachers"}{" "}
              Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleSingleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {((singleFileType === "students-parents" && studentsFile) ||
              (singleFileType === "teachers" && teachersFile)) && (
              <p className="mt-1 text-sm text-gray-600">
                Selected:{" "}
                {
                  (singleFileType === "students-parents"
                    ? studentsFile
                    : teachersFile
                  )?.name
                }{" "}
                (
                {Math.round(
                  ((singleFileType === "students-parents"
                    ? studentsFile
                    : teachersFile
                  )?.size || 0) / 1024
                )}{" "}
                KB)
              </p>
            )}
          </div>
        ) : (
          // Dual File Upload
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Students+Parents File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Students+Parents Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleStudentsFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {studentsFile && (
                  <p className="mt-1 text-sm text-gray-600">
                    Selected: {studentsFile.name} (
                    {Math.round(studentsFile.size / 1024)} KB)
                  </p>
                )}
              </div>

              {/* Teachers File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teachers Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleTeachersFileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {teachersFile && (
                  <p className="mt-1 text-sm text-gray-600">
                    Selected: {teachersFile.name} (
                    {Math.round(teachersFile.size / 1024)} KB)
                  </p>
                )}
              </div>
            </div>

            {/* Dual File Status */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Upload Status:
                </span>
                <div className="flex space-x-4">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      studentsFile
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    Students+Parents: {studentsFile ? "✓ Ready" : "○ Pending"}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      teachersFile
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    Teachers: {teachersFile ? "✓ Ready" : "○ Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={
            (importType === "single"
              ? singleFileType === "students-parents"
                ? !studentsFile
                : !teachersFile
              : !studentsFile || !teachersFile) || isLoading
          }
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? importType === "dual"
              ? "Processing Both Files..."
              : "Importing..."
            : importType === "dual"
            ? "Import Both Files"
            : "Import File"}
        </button>

        {/* File format note */}
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Supported formats:</strong> Excel (.xlsx, .xls)
            <br />
            <strong>Note:</strong> For Excel files, use the first worksheet
            only. Date columns should be formatted as YYYY-MM-DD.
            <br />
            {importType === "dual" && (
              <>
                <strong>Dual Mode:</strong> Both files will be processed
                sequentially. Students+Parents first, then Teachers.
              </>
            )}
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

          {/* Deletion Statistics (when sync mode is enabled) */}
          {syncMode && result.data.deletedUsers && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">
                🗑️ Users Deleted (Sync Mode):
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-700">
                    {result.data.deletedUsers.students}
                  </div>
                  <div className="text-xs text-yellow-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-700">
                    {result.data.deletedUsers.parents}
                  </div>
                  <div className="text-xs text-yellow-600">Parents</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-700">
                    {result.data.deletedUsers.teachers}
                  </div>
                  <div className="text-xs text-yellow-600">Teachers</div>
                </div>
              </div>
            </div>
          )}

          {/* Import Type Indicator */}
          <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-md">
            <span className="text-sm font-medium text-gray-700">
              Import Type:{" "}
              {importType === "dual"
                ? "🔄 Dual File Import"
                : "📄 Single File Import"}
            </span>
            {importType === "dual" && (
              <span className="ml-2 text-xs text-gray-500">
                (Students+Parents + Teachers)
              </span>
            )}
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
