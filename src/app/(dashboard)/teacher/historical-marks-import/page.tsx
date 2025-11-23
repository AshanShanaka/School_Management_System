"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const HistoricalMarksImportPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [termName, setTermName] = useState("");
  const [historicalGrade, setHistoricalGrade] = useState<string>("10"); // Default to Grade 10 (O/L)
  const [teacherClass, setTeacherClass] = useState<any>(null);
  const [isLoadingClass, setIsLoadingClass] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Fetch teacher's assigned class
  useEffect(() => {
    const fetchTeacherClass = async () => {
      try {
        setIsLoadingClass(true);
        const response = await fetch('/api/class-teacher/my-class');
        if (response.ok) {
          const data = await response.json();
          if (data && data.class) {
            setTeacherClass(data.class);
          } else {
            toast.error("You are not assigned as a class teacher");
          }
        }
      } catch (error) {
        console.error("Error fetching teacher class:", error);
        toast.error("Failed to load your assigned class");
      } finally {
        setIsLoadingClass(false);
      }
    };
    
    fetchTeacherClass();
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
    if (!teacherClass) {
      toast.error("No class assigned. Please contact admin.");
      return;
    }

    try {
      setIsDownloading(true);
      
      const response = await fetch(`/api/historical-marks/import?classId=${teacherClass.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
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

    if (!teacherClass) {
      toast.error("No class assigned");
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
      formData.append('classId', teacherClass.id);
      formData.append('historicalGrade', historicalGrade); // Add historical grade

      const response = await fetch('/api/historical-marks/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
      
      // Always show modal after upload completes
      if (data.stats?.errors === 0 || (data.success && !data.errors?.length)) {
        // No errors - show success
        setShowSuccessModal(true);
      } else {
        // Has errors - show error modal
        setShowErrorModal(true);
      }
      
      // Reset form only on success
      if (data.stats?.errors === 0) {
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
      
      // Create error upload result for modal
      setUploadResult({
        success: false,
        errors: [error.message || "Failed to upload file"],
        stats: { errors: 1, processed: 0 }
      });
      setShowErrorModal(true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Import Historical Marks
            </h1>
            <p className="text-sm text-gray-600 mt-1">Upload Grade 9 & 10 historical examination results for your class</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-purple-200 hover:bg-white hover:border-purple-300 text-gray-700 rounded-lg transition-all shadow-sm"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Class Info Banner */}
        {isLoadingClass ? (
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <p className="text-gray-600">Loading class information...</p>
            </div>
          </div>
        ) : teacherClass ? (
          <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-purple-200/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">🎓</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Your Class</p>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent mt-0.5">
                  {teacherClass.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {teacherClass.grade && `Grade ${teacherClass.grade.level}`} • {teacherClass.students?.length || 0} Students
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 backdrop-blur-md rounded-xl p-6 border border-amber-200 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⚠</span>
              </div>
              <div>
                <h3 className="font-bold text-amber-900">No Class Assigned</h3>
                <p className="text-amber-700 text-sm mt-1">Please contact administrator.</p>
              </div>
            </div>
          </div>
        )}

        {/* Download Template Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-6 py-4 border-b border-purple-100">
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Step 1: Download Template
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">Download the Excel template with pre-filled student list</p>
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloading || !teacherClass}
              className="w-full px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Template</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-6 py-4 border-b border-purple-100">
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Step 2: Upload Completed File
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Historical Grade Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Historical Grade <span className="text-red-500">*</span>
              </label>
              <select
                value={historicalGrade}
                onChange={(e) => setHistoricalGrade(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all"
                disabled={isUploading}
              >
                <option value="9">Grade 9 (Historical Marks)</option>
                <option value="10">Grade 10 (O/L Historical Marks)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the grade level for these historical marks (Grade 9 or 10)
              </p>
            </div>

            {/* Term Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Term Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                placeholder='e.g., "Grade 9 - Term 1"'
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all"
                disabled={isUploading}
              />
            </div>

            {/* File Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Excel File <span className="text-red-500">*</span>
              </label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-br file:from-purple-500 file:to-indigo-600 file:text-white hover:file:from-purple-600 hover:file:to-indigo-700 file:cursor-pointer cursor-pointer bg-white/50 backdrop-blur-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {selectedFile && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !termName.trim() || isUploading || !teacherClass}
              className="w-full px-6 py-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload & Import</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload Result - Only show if there are errors */}
        {uploadResult && uploadResult.errors && uploadResult.errors.length > 0 && (
          <div className="bg-red-50/70 backdrop-blur-md rounded-xl p-6 shadow-lg border border-red-200">
            <h2 className="font-bold text-xl mb-4 text-red-900">Upload Errors</h2>
            
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">
                Errors ({uploadResult.errors.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800 max-h-40 overflow-y-auto">
                {uploadResult.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && uploadResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h3>
              <p className="text-gray-600 mb-6">
                {uploadResult.stats?.processed} marks imported successfully for {uploadResult.termName}
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="/teacher/view-historical-marks"
                  className="w-full px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 font-semibold transition-all shadow-lg"
                >
                  View All Marks
                </a>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">
                Upload Failed
              </h3>
              <p className="text-gray-600 mb-4 font-medium">
                {uploadResult?.stats ? 
                  `${uploadResult.stats.processed || 0} successful, ${uploadResult.stats.errors || 0} errors` :
                  'Unable to process the file'
                }
              </p>
              
              {uploadResult?.errors && uploadResult.errors.length > 0 && (
                <div className="mb-6">
                  {/* Check if error contains grade requirement message */}
                  {uploadResult.errors.some((err: string) => err.toLowerCase().includes('grade') && (err.includes('9') || err.includes('10'))) ? (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-amber-900 font-bold text-lg">Grade Requirement Error</p>
                      </div>
                      <p className="text-amber-900 font-semibold mb-2">
                        📚 Historical grade must be 9 or 10
                      </p>
                      <p className="text-amber-800 text-sm">
                        You can only upload marks for Grade 9 or Grade 10 students. Please verify your class grade level.
                      </p>
                    </div>
                  ) : null}
                  
                  {/* Show all errors */}
                  <div className="max-h-40 overflow-y-auto text-left bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-red-900 font-semibold text-sm mb-2">Error Details:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                      {uploadResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 font-semibold transition-all shadow-lg"
                >
                  OK, I'll Fix It
                </button>
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setUploadResult(null);
                  }}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalMarksImportPage;
