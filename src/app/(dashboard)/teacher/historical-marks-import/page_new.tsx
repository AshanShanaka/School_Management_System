"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const HistoricalMarksImportPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [termName, setTermName] = useState("");
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
      formData.append('historicalGrade', '10'); // Teachers only work with Grade 10

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
        if (data.stats?.errors === 0) {
          setShowSuccessModal(true);
        } else {
          setShowErrorModal(true);
        }
        
        // Reset form
        setSelectedFile(null);
        setTermName("");
        
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setShowErrorModal(true);
      }

    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
      setShowErrorModal(true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Import Historical Marks</h1>
            <p className="text-sm text-gray-500 mt-1">Upload Grade 10 O/L examination results for predictions</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-all shadow-sm"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Students Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-2">Total Students</p>
              <h3 className="text-4xl font-bold mb-2">
                {teacherClass?.students?.length || 0}
              </h3>
              <p className="text-purple-100 text-xs">In {teacherClass?.name || 'Class'}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Terms Required Card */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-2">Terms Required</p>
              <h3 className="text-4xl font-bold mb-2">9</h3>
              <p className="text-blue-100 text-xs">For Predictions</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Subjects Card */}
        <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium mb-2">O/L Subjects</p>
              <h3 className="text-4xl font-bold mb-2">10+</h3>
              <p className="text-pink-100 text-xs">To Import</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-2">Import Status</p>
              <h3 className="text-4xl font-bold mb-2">
                {uploadResult ? '✓' : '○'}
              </h3>
              <p className="text-indigo-100 text-xs">
                {uploadResult ? 'Completed' : 'Ready'}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left & Center - Main Process */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Info Banner */}
          {isLoadingClass ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <p className="text-gray-600">Loading class information...</p>
              </div>
            </div>
          ) : teacherClass ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl">🎓</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Assigned Class</p>
                  <h3 className="text-xl font-bold text-gray-900">{teacherClass.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {teacherClass.grade && `Grade ${teacherClass.grade.level}`} • {teacherClass.students?.length || 0} Students
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">⚠</span>
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-lg">No Class Assigned</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Please contact administrator to assign you as a class teacher.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Import Process Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Import Process</h2>
              <p className="text-sm text-gray-600 mt-0.5">Follow these steps to import historical marks</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Download */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-2">Download Template</h3>
                  <p className="text-sm text-gray-600 mb-3">Get Excel file with your students list pre-filled</p>
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={isDownloading || !teacherClass}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

              <div className="border-t border-gray-100"></div>

              {/* Step 2: Fill */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-lg">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-2">Fill Marks in Excel</h3>
                  <p className="text-sm text-gray-600">Enter marks for each subject (0-100) in the downloaded file</p>
                </div>
              </div>

              <div className="border-t border-gray-100"></div>

              {/* Step 3: Upload */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <span className="text-pink-600 font-bold text-lg">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-3">Upload Completed File</h3>
                  
                  <div className="space-y-4">
                    {/* Term Name Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Term Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={termName}
                        onChange={(e) => setTermName(e.target.value)}
                        placeholder='e.g., "Grade 10 - Term 1"'
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        disabled={isUploading}
                      />
                    </div>

                    {/* File Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Excel File <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="file-input"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          disabled={isUploading}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer border border-gray-300 rounded-xl"
                        />
                      </div>
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
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-base"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Uploading & Importing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Upload & Import Marks</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Result Section */}
          {uploadResult && (
            <div className={`rounded-2xl p-6 shadow-sm border ${
              uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <h2 className={`font-bold text-xl mb-4 ${
                uploadResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                Import Results
              </h2>
              
              {uploadResult.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-xs text-gray-600 uppercase font-medium mb-1">Total Rows</div>
                    <div className="text-3xl font-bold text-gray-800">{uploadResult.stats.totalRows}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-xs text-gray-600 uppercase font-medium mb-1">Processed</div>
                    <div className="text-3xl font-bold text-green-600">{uploadResult.stats.processed}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-xs text-gray-600 uppercase font-medium mb-1">Skipped</div>
                    <div className="text-3xl font-bold text-yellow-600">{uploadResult.stats.skipped}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-xs text-gray-600 uppercase font-medium mb-1">Errors</div>
                    <div className="text-3xl font-bold text-red-600">{uploadResult.stats.errors}</div>
                  </div>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-red-200 mb-4">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Errors ({uploadResult.errors.length})
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800 max-h-40 overflow-y-auto">
                    {uploadResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Imported Marks Preview Table */}
              {uploadResult.importedMarks && uploadResult.importedMarks.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Imported Marks Preview</h3>
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
                        <span className="text-gray-600">Valid</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
                        <span className="text-gray-600">Error</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span>
                        <span className="text-gray-600">Empty</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                              Index No.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student Name
                            </th>
                            {uploadResult.subjects && uploadResult.subjects.map((subject: string) => (
                              <th key={subject} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {subject}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {uploadResult.importedMarks.map((student: any, idx: number) => (
                            <tr key={idx} className={student.hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'}>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white z-10">
                                {student.indexNumber}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                {student.studentName}
                              </td>
                              {uploadResult.subjects && uploadResult.subjects.map((subject: string) => {
                                const mark = student.marks[subject];
                                let bgColor = 'bg-gray-100';
                                let textColor = 'text-gray-400';
                                let displayValue = '-';
                                let title = '';

                                if (mark) {
                                  if (mark.status === 'valid') {
                                    bgColor = 'bg-green-100';
                                    textColor = 'text-green-800';
                                    displayValue = mark.value;
                                  } else if (mark.status === 'error') {
                                    bgColor = 'bg-red-100';
                                    textColor = 'text-red-800';
                                    displayValue = mark.value || '✗';
                                    title = mark.error || 'Invalid mark';
                                  } else if (mark.status === 'empty') {
                                    bgColor = 'bg-gray-100';
                                    textColor = 'text-gray-400';
                                    displayValue = '-';
                                  }
                                }

                                return (
                                  <td key={subject} className="px-4 py-3 text-center">
                                    <span
                                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${bgColor} ${textColor}`}
                                      title={title}
                                    >
                                      {displayValue}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-center">
                                {student.hasErrors ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium" title={student.errors.join(', ')}>
                                    <span>⚠</span>
                                    {student.errors.length} Error{student.errors.length > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    <span>✓</span>
                                    Valid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Quick Guide Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Quick Guide</h3>
                <p className="text-sm text-gray-600">Follow the 3-step process</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Download template with student list</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Enter marks (0-100) for each subject</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Upload file and see instant validation</span>
              </li>
            </ul>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Pro Tips</h3>
                <p className="text-sm text-gray-600">Best practices</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">✓</span>
                <span>Use consistent term naming format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">✓</span>
                <span>Verify marks before uploading</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">✓</span>
                <span>Import all 6 terms for best predictions</span>
              </li>
            </ul>
          </div>

          {/* Support Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">Contact support if you encounter any issues</p>
              <button className="text-sm text-purple-600 font-semibold hover:text-purple-700">
                Get Support →
              </button>
            </div>
          </div>
        </div>
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
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold transition-all shadow-lg"
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
      {showErrorModal && uploadResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Completed with Errors</h3>
              <p className="text-gray-600 mb-4">
                {uploadResult.stats?.processed} successful, {uploadResult.stats?.errors} errors
              </p>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mb-6 max-h-40 overflow-y-auto text-left bg-red-50 rounded-lg p-4">
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                    {uploadResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold transition-all shadow-lg"
                >
                  Review & Fix Errors
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
