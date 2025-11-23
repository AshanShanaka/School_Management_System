"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const HistoricalMarksImportPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [termName, setTermName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [historicalGrade, setHistoricalGrade] = useState<string>(""); // Grade 9 or 10
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Fetch Grade 11 classes (current students)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoadingClasses(true);
        
        // Fetch all grades to find Grade 11
        const gradesResponse = await fetch('/api/grades?all=true');
        if (!gradesResponse.ok) {
          throw new Error('Failed to fetch grades');
        }
        const gradesData = await gradesResponse.json();
        console.log("Fetched grades:", gradesData);
        
        // Find Grade 11 from grades array
        const allGrades = gradesData.grades || [];
        const grade11 = allGrades.find((g: any) => g.level === 11);
        
        if (!grade11) {
          console.log("Grade 11 not found in grades:", allGrades.map((g: any) => `Grade ${g.level}`));
          toast.info("Grade 11 not found. Please create Grade 11 first.");
          setClasses([]);
          return;
        }
        
        // Fetch classes for Grade 11
        console.log("Found Grade 11:", grade11);
        const classes11Response = await fetch(`/api/classes?gradeId=${grade11.id}`);
        if (classes11Response.ok) {
          const classes11Data = await classes11Response.json();
          const allClasses = classes11Data.classes || [];
          
          // Sort by name
          allClasses.sort((a: any, b: any) => a.name.localeCompare(b.name));
          
          console.log("Grade 11 classes found:", allClasses.length);
          setClasses(allClasses);
          
          if (allClasses.length === 0) {
            toast.info("No classes found for Grade 11. Please create Grade 11 classes first.");
          }
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes");
      } finally {
        setIsLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }

    if (!historicalGrade) {
      toast.error("Please select which grade marks to import (9 or 10)");
      return;
    }

    try {
      setIsDownloading(true);
      
      const response = await fetch(`/api/historical-marks/import?classId=${selectedClass}&historicalGrade=${historicalGrade}`, {
        method: 'GET',
      });

      if (!response.ok) {
        // Try to parse as JSON first (error response)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to download template');
        } else {
          throw new Error(`Failed to download template: ${response.status} ${response.statusText}`);
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Historical_Marks_Template_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Template downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading template:", error);
      toast.error(error.message || "Failed to download template");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    if (!historicalGrade) {
      toast.error("Please select which grade marks to import (9 or 10)");
      return;
    }

    if (!termName.trim()) {
      toast.error("Please enter a term name");
      return;
    }

    try {
      setIsUploading(true);
      setUploadResult(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('termName', termName.trim());
      formData.append('classId', selectedClass);
      formData.append('historicalGrade', historicalGrade);

      const response = await fetch('/api/historical-marks/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
      
      if (data.success) {
        toast.success(data.message || "Historical marks imported successfully!");
        
        // Reset form
        setSelectedFile(null);
        setTermName("");
        
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }

    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 mb-6 border-2 border-purple-200 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-3xl">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Import Historical Marks
              </h1>
              <p className="text-gray-600 font-medium mt-1">
                Grade 9 & 10 historical data for O/L predictions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Class Selection */}
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border-2 border-purple-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Class Selection
          </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Grade 11 Class <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={isLoadingClasses}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select current class --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.grade?.level && `(Grade ${cls.grade.level})`}
              </option>
            ))}
          </select>
          {isLoadingClasses && (
            <p className="text-xs text-gray-500 mt-1">Loading classes...</p>
          )}
          {selectedClass && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span>✓</span> Class selected
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Historical Grade (Which marks are you importing?) <span className="text-red-500">*</span>
          </label>
          <select
            value={historicalGrade}
            onChange={(e) => setHistoricalGrade(e.target.value)}
            disabled={!selectedClass}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select historical grade --</option>
            <option value="9">Grade 9 Marks (when they were in Grade 9)</option>
            <option value="10">Grade 10 Marks (when they were in Grade 10)</option>
          </select>
          {historicalGrade && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span>✓</span> Will import Grade {historicalGrade} historical marks
            </p>
          )}
        </div>
      </div>

      {/* Download Template Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-3">Step 2: Download Template</h2>
        <button
          onClick={handleDownloadTemplate}
          disabled={isDownloading || !selectedClass || !historicalGrade}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
        >
          {isDownloading ? (
            <>
              <span className="animate-spin">⏳</span>
              Downloading...
            </>
          ) : (
            <>
              <span>📥</span>
              Download Excel Template
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Template will include students from the selected class
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-3">Step 3: Upload Filled Template</h2>
        
        {/* Term Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={termName}
            onChange={(e) => setTermName(e.target.value)}
            placeholder="e.g., Grade 9 - Term 1, Grade 10 - Term 2"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the term/exam name for these marks
          </p>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel File <span className="text-red-500">*</span>
          </label>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <span>✓</span> Selected: {selectedFile.name}
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || !termName.trim() || !selectedClass || !historicalGrade || isUploading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <span className="animate-spin">⏳</span>
              Uploading...
            </>
          ) : (
            <>
              <span>📤</span>
              Upload & Import Marks
            </>
          )}
        </button>
      </div>

      {/* Upload Result Section */}
      {uploadResult && (
        <div className={`p-4 rounded-lg border ${
          uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h2 className={`font-semibold mb-3 ${
            uploadResult.success ? 'text-green-900' : 'text-red-900'
          }`}>
            Import Results
          </h2>
          
          {uploadResult.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600">Total Rows</div>
                <div className="text-2xl font-bold text-gray-800">
                  {uploadResult.stats.totalRows}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600">Processed</div>
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.stats.processed}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600">Skipped</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {uploadResult.stats.skipped}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600">Errors</div>
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.stats.errors}
                </div>
              </div>
            </div>
          )}

          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="bg-white p-3 rounded border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">
                Errors/Warnings ({uploadResult.errors.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800 max-h-40 overflow-y-auto">
                {uploadResult.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              {uploadResult.stats?.errors > 10 && (
                <p className="text-xs text-red-600 mt-2">
                  Showing first 10 errors. Check console for full list.
                </p>
              )}
            </div>
          )}

          {uploadResult.success && uploadResult.stats?.errors === 0 && (
            <p className="text-sm text-green-800">
              ✓ All marks imported successfully for <strong>{uploadResult.termName}</strong>
            </p>
          )}
        </div>
      )}

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          Important Notes
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
          <li>This system is for importing historical Grade 9 & Grade 10 marks</li>
          <li>Marks are used for O/L predictions (minimum 9 terms required)</li>
          <li>Students must have an Index Number to be imported</li>
          <li>If the same term is uploaded again, marks will be updated</li>
          <li>All subjects must exist in the system database</li>
          <li>Marks must be between 0 and 100</li>
        </ul>
      </div>
    </div>
  );
};

export default HistoricalMarksImportPage;
