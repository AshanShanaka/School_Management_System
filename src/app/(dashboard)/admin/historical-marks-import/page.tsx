"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const HistoricalMarksImportPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [termName, setTermName] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [historicalGrade, setHistoricalGrade] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Fetch Grade 11 classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoadingClasses(true);
        
        const gradesResponse = await fetch('/api/grades?all=true');
        if (!gradesResponse.ok) {
          throw new Error('Failed to fetch grades');
        }
        const gradesData = await gradesResponse.json();
        
        const allGrades = gradesData.grades || [];
        const grade11 = allGrades.find((g: any) => g.level === 11);
        
        if (!grade11) {
          toast.info("Grade 11 not found. Please create Grade 11 first.");
          setClasses([]);
          return;
        }
        
        const classes11Response = await fetch(`/api/classes?gradeId=${grade11.id}`);
        if (classes11Response.ok) {
          const classes11Data = await classes11Response.json();
          const allClasses = classes11Data.classes || [];
          allClasses.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setClasses(allClasses);
          
          if (allClasses.length === 0) {
            toast.info("No classes found for Grade 11.");
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
      toast.error("Please select historical grade");
      return;
    }

    try {
      setIsDownloading(true);
      
      const response = await fetch(`/api/historical-marks/import?classId=${selectedClass}&historicalGrade=${historicalGrade}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to download template');
        } else {
          throw new Error(`Failed to download template`);
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Historical_Marks_Grade${historicalGrade}_${Date.now()}.xlsx`;
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
      toast.error("Please select historical grade");
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
        
        setSelectedFile(null);
        setTermName("");
        
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

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Selection & Template */}
        <div className="space-y-6">
          {/* Class Selection */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border-2 border-purple-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Class Selection
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Grade 11 Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={isLoadingClasses}
                  className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 font-medium transition-all"
                >
                  <option value="">Select class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.grade?.level && `(Grade ${cls.grade.level})`}
                    </option>
                  ))}
                </select>
                {isLoadingClasses && (
                  <p className="text-xs text-gray-500 mt-1">Loading classes...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Historical Grade
                </label>
                <select
                  value={historicalGrade}
                  onChange={(e) => setHistoricalGrade(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 font-medium transition-all"
                >
                  <option value="">Select grade...</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                </select>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border-2 border-green-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📥</span>
              Download Template
            </h2>
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloading || !selectedClass || !historicalGrade}
              className="w-full px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold transition-all shadow-md flex items-center justify-center gap-2"
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
            <p className="text-xs text-gray-600 mt-3 text-center">
              Template includes all students with pre-filled data
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm border-2 border-blue-300 rounded-xl p-5 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-xl">💡</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2 text-base">Quick Tips</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Download template with student data pre-filled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Enter marks (0-100) for each subject</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Leave empty cells for absent students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Minimum 9 terms required for predictions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Upload */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border-2 border-purple-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📤</span>
              Upload Marks
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Term Name
                </label>
                <input
                  type="text"
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                  placeholder="e.g., Grade 9 - Term 1"
                  className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 font-medium transition-all"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Excel File
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 font-medium transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {selectedFile && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <span>✓</span> {selectedFile.name}
                  </p>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || !termName.trim() || !selectedClass || !historicalGrade || isUploading}
                className="w-full px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Import Marks
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border-2 ${
              uploadResult.success ? 'border-green-300' : 'border-red-300'
            }`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                uploadResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                <span className="text-xl">{uploadResult.success ? '✅' : '⚠️'}</span>
                Import Results
              </h2>
              
              {uploadResult.stats && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border-2 border-gray-200">
                    <div className="text-xs text-gray-600 font-medium">Total Rows</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">
                      {uploadResult.stats.totalRows}
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border-2 border-green-200">
                    <div className="text-xs text-green-600 font-medium">Processed</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {uploadResult.stats.processed}
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border-2 border-yellow-200">
                    <div className="text-xs text-yellow-600 font-medium">Skipped</div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1">
                      {uploadResult.stats.skipped}
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border-2 border-red-200">
                    <div className="text-xs text-red-600 font-medium">Errors</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                      {uploadResult.stats.errors}
                    </div>
                  </div>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="bg-red-50/70 backdrop-blur-sm p-4 rounded-lg border-2 border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">
                    Issues Found ({uploadResult.errors.length})
                  </h3>
                  <ul className="space-y-1 text-xs text-red-800 max-h-40 overflow-y-auto">
                    {uploadResult.errors.slice(0, 10).map((error: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                  {uploadResult.errors.length > 10 && (
                    <p className="text-xs text-red-600 mt-2">
                      Showing first 10 of {uploadResult.errors.length} issues
                    </p>
                  )}
                </div>
              )}

              {uploadResult.success && uploadResult.stats?.errors === 0 && (
                <div className="bg-green-50/70 backdrop-blur-sm p-4 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                    <span>✓</span>
                    Successfully imported marks for <strong>{uploadResult.termName}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalMarksImportPage;
