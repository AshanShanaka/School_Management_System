"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Upload, FileSpreadsheet } from "lucide-react";

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

const CsvImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"students-parents" | "teachers">(
    "students-parents"
  );
  const [clearExisting, setClearExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);

      const fileName = selectedFile.name.toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        toast.success("Excel file selected successfully.");
      } else {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    // Convert "students-parents" to "students" for API compatibility
    const apiType = importType === "students-parents" ? "students" : "teachers";
    formData.append("importType", apiType);
    formData.append("clearExisting", clearExisting.toString());

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const result: ImportResult = await response.json();
      setResult(result);

      if (result.success) {
        toast.success(result.message);
        setFile(null);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-green-100 rounded-full p-2">
          <Upload className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Upload Data</h2>
          <p className="text-sm text-gray-600">
            Select and upload your Excel file
          </p>
        </div>
      </div>

      {/* Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Import Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="importType"
              value="students-parents"
              checked={importType === "students-parents"}
              onChange={(e) =>
                setImportType(e.target.value as "students-parents" | "teachers")
              }
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Students & Parents</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="importType"
              value="teachers"
              checked={importType === "teachers"}
              onChange={(e) =>
                setImportType(e.target.value as "students-parents" | "teachers")
              }
              className="w-4 h-4 text-green-600"
            />
            <span className="ml-2 text-sm text-gray-700">Teachers</span>
          </label>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {file ? file.name : "Click to select Excel file"}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Supports .xlsx and .xls files
            </span>
          </label>
        </div>
      </div>

      {/* Options */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={clearExisting}
            onChange={(e) => setClearExisting(e.target.checked)}
            className="w-4 h-4 text-red-600"
          />
          <span className="ml-2 text-sm text-gray-700">
            Clear existing data before import
          </span>
        </label>
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!file || isLoading}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Import Data</span>
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 p-4 border rounded-lg">
          <div className={`mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            <strong>{result.success ? '✓' : '✗'} {result.message}</strong>
          </div>
          
          {result.data && (
            <div className="text-sm text-gray-600 space-y-1">
              <div>Total rows processed: {result.data.totalRows}</div>
              <div>Successful imports: {result.data.successfulImports}</div>
              {result.data.errors.length > 0 && (
                <div>Errors: {result.data.errors.length}</div>
              )}
              {result.data.skipped.length > 0 && (
                <div>Skipped: {result.data.skipped.length}</div>
              )}
            </div>
          )}

          {/* Show errors if any */}
          {result.data?.errors && result.data.errors.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto">
              <div className="text-xs text-red-600">
                <strong>Errors:</strong>
                {result.data.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="mt-1">
                    Row {error.row}: {error.error}
                  </div>
                ))}
                {result.data.errors.length > 5 && (
                  <div className="mt-1">...and {result.data.errors.length - 5} more errors</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CsvImport;