'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Class {
  id: number;
  name: string;
  capacity: number;
  grade: {
    id: number;
    level: number;
  };
  _count: {
    students: number;
  };
}

interface BatchTimetableGeneratorProps {
  classes: Class[];
}

interface GenerationProgress {
  classId: number;
  className: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  message?: string;
}

const BatchTimetableGenerator: React.FC<BatchTimetableGeneratorProps> = ({ classes }) => {
  const router = useRouter();
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress[]>([]);
  const [showResults, setShowResults] = useState(false);

  const toggleClassSelection = (classId: number) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const selectAll = () => {
    setSelectedClasses(classes.map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedClasses([]);
  };

  const generateBatchTimetables = async () => {
    if (selectedClasses.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    setGenerating(true);
    setShowResults(true);

    // Initialize progress
    const initialProgress: GenerationProgress[] = selectedClasses.map(classId => {
      const classData = classes.find(c => c.id === classId)!;
      return {
        classId,
        className: classData.name,
        status: 'pending' as const,
      };
    });
    setProgress(initialProgress);

    toast.loading(`🚀 Generating timetables for ${selectedClasses.length} classes...`, {
      duration: 2000,
      position: 'top-center',
    });

    // Generate timetables sequentially to avoid conflicts
    for (let i = 0; i < selectedClasses.length; i++) {
      const classId = selectedClasses[i];
      const classData = classes.find(c => c.id === classId)!;

      // Update status to generating
      setProgress(prev => prev.map(p => 
        p.classId === classId 
          ? { ...p, status: 'generating' as const, message: 'Generating optimal schedule...' }
          : p
      ));

      try {
        const response = await fetch(`/api/timetables/${classId}/auto-schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            options: {
              preserveExisting: false,
              balanceSubjects: true,
              respectTeacherPreferences: true,
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate timetable');
        }

        // Update status to completed
        setProgress(prev => prev.map(p => 
          p.classId === classId 
            ? { ...p, status: 'completed' as const, message: '✓ Timetable generated successfully!' }
            : p
        ));

        toast.success(`✓ ${classData.name} completed`, {
          duration: 2000,
        });

      } catch (error) {
        console.error(`Error generating timetable for ${classData.name}:`, error);
        
        setProgress(prev => prev.map(p => 
          p.classId === classId 
            ? { ...p, status: 'error' as const, message: '✗ Failed to generate timetable' }
            : p
        ));

        toast.error(`✗ Failed for ${classData.name}`, {
          duration: 3000,
        });
      }
    }

    setGenerating(false);

    const successCount = progress.filter(p => p.status === 'completed').length;
    const totalCount = selectedClasses.length;

    if (successCount === totalCount) {
      toast.success(`🎉 All ${totalCount} timetables generated successfully!`, {
        duration: 4000,
        position: 'top-center',
        icon: '✨',
      });
    } else {
      toast(`${successCount}/${totalCount} timetables generated`, {
        duration: 3000,
      });
    }
  };

  const finishAndRedirect = () => {
    router.push('/admin/timetable');
    router.refresh();
  };

  // Group classes by grade
  const classesGroupedByGrade = classes.reduce((acc, classItem) => {
    const gradeLevel = classItem.grade.level;
    if (!acc[gradeLevel]) {
      acc[gradeLevel] = [];
    }
    acc[gradeLevel].push(classItem);
    return acc;
  }, {} as Record<number, Class[]>);

  return (
    <div className="space-y-6">
      {!showResults ? (
        <>
          {/* Header */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-8 border-2 border-violet-200">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-2xl shadow-lg">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  🚀 Batch Timetable Generation
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Select multiple classes and generate all their timetables automatically in one go!
                </p>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={selectAll}
                  className="bg-violet-100 hover:bg-violet-200 text-violet-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Select All ({classes.length})
                </button>
                <button
                  onClick={deselectAll}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Deselect All
                </button>
                <div className="bg-violet-600 text-white px-6 py-2 rounded-lg font-bold">
                  {selectedClasses.length} Selected
                </div>
              </div>
            </div>
          </div>

          {/* Class Selection Grid */}
          <div className="space-y-6">
            {Object.entries(classesGroupedByGrade)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([gradeLevel, gradeClasses]) => (
                <div key={gradeLevel} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <div className="bg-violet-100 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                    </div>
                    Grade {gradeLevel}
                    <span className="text-sm font-normal text-gray-500">
                      ({gradeClasses.length} classes)
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {gradeClasses.map((classItem) => {
                      const isSelected = selectedClasses.includes(classItem.id);
                      return (
                        <button
                          key={classItem.id}
                          onClick={() => toggleClassSelection(classItem.id)}
                          className={`relative border-2 p-4 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${
                            isSelected
                              ? "border-violet-500 bg-violet-50 shadow-lg scale-105"
                              : "border-gray-200 hover:border-violet-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-violet-500 text-white rounded-full p-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg ${
                              isSelected 
                                ? "bg-violet-500 text-white" 
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className={`font-bold text-lg ${
                                isSelected ? "text-violet-700" : "text-gray-800"
                              }`}>
                                {classItem.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {classItem._count.students} students
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          {/* Generate Button */}
          {selectedClasses.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t-2 border-violet-200 p-6 rounded-xl shadow-2xl">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Ready to generate {selectedClasses.length} timetable{selectedClasses.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-gray-600">This will take approximately {selectedClasses.length * 2} seconds</p>
                </div>
                <button
                  onClick={generateBatchTimetables}
                  disabled={generating}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate All Timetables
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Generation Progress */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <svg className="w-8 h-8 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Generation Progress
            </h3>

            <div className="space-y-3">
              {progress.map((item) => (
                <div
                  key={item.classId}
                  className={`border-2 rounded-lg p-4 transition-all duration-300 ${
                    item.status === 'completed'
                      ? 'border-green-300 bg-green-50'
                      : item.status === 'generating'
                      ? 'border-violet-300 bg-violet-50 animate-pulse'
                      : item.status === 'error'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        item.status === 'completed'
                          ? 'bg-green-500'
                          : item.status === 'generating'
                          ? 'bg-violet-500'
                          : item.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                      }`}>
                        {item.status === 'completed' ? (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : item.status === 'generating' ? (
                          <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : item.status === 'error' ? (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{item.className}</h4>
                        <p className={`text-sm ${
                          item.status === 'completed'
                            ? 'text-green-700'
                            : item.status === 'generating'
                            ? 'text-violet-700'
                            : item.status === 'error'
                            ? 'text-red-700'
                            : 'text-gray-600'
                        }`}>
                          {item.message || 'Waiting...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Actions */}
            {!generating && (
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowResults(false);
                    setProgress([]);
                    setSelectedClasses([]);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Generate More
                </button>
                <button
                  onClick={finishAndRedirect}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  View All Timetables
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BatchTimetableGenerator;
