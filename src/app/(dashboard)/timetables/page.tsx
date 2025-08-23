// Modern Timetable Management Page - All Roles
"use client";

import React, { useState, useEffect } from "react";
import ModernTimetableGrid from "@/components/ModernTimetableGrid";
import TimetableView from "@/components/TimetableView";
import SpecialDaysManager from "@/components/SpecialDaysManager";
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Download,
  Upload,
  BarChart3,
  BookOpen,
  GraduationCap,
  Building,
  Eye,
  Edit,
} from "lucide-react";

interface ClassOption {
  id: number;
  name: string;
  gradeLevel: number;
}

interface UserInfo {
  id: string;
  role: string;
  name?: string;
}

const TimetableManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "timetable" | "special-days" | "analytics"
  >("timetable");
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userTimetables, setUserTimetables] = useState<any[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load user info and appropriate timetables
  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      if (userInfo.role === 'admin') {
        loadClasses();
      } else {
        loadUserTimetables();
      }
    }
  }, [userInfo]);

  const loadUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded user info:', data.user);
        setUserInfo(data.user);
      } else {
        console.error('Failed to fetch user info:', response.status, response.statusText);
        setLoading(false); // Stop loading if auth fails
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      setLoading(false); // Stop loading on error
    }
  };

  const loadUserTimetables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/timetables/user');
      if (response.ok) {
        const timetables = await response.json();
        console.log('Loaded user timetables:', timetables.length, 'timetables');
        setUserTimetables(timetables);
        if (timetables.length > 0) {
          setSelectedTimetable(timetables[0]);
        }
      } else {
        console.error('Failed to fetch user timetables:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading user timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load available classes (Admin only)
  useEffect(() => {
    if (userInfo?.role === 'admin') {
      loadClasses();
    }
  }, [userInfo]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      // Fetch active classes from the database
      const response = await fetch('/api/classes/active');
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = await response.json();
      const activeClasses: ClassOption[] = data.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        gradeLevel: cls.grade?.level || 1,
      }));
      
      setClasses(activeClasses);
      if (activeClasses.length > 0) {
        setSelectedClass(activeClasses[0].id);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      // Fallback to empty array if API fails
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Group classes by grade level
  const groupedClasses = classes.reduce((acc, cls) => {
    if (!acc[cls.gradeLevel]) {
      acc[cls.gradeLevel] = [];
    }
    acc[cls.gradeLevel].push(cls);
    return acc;
  }, {} as Record<number, ClassOption[]>);

  // Auto-schedule all classes in the same grade
  const handleBulkAutoSchedule = async () => {
    if (!selectedClass) return;
    
    try {
      setAutoScheduling(true);
      const selectedClassData = classes.find(c => c.id === selectedClass);
      if (!selectedClassData) return;

      // Get all classes in the same grade
      const sameGradeClasses = classes.filter(c => c.gradeLevel === selectedClassData.gradeLevel);
      
      let successCount = 0;
      let errorCount = 0;

      // Auto-schedule each class
      for (const classData of sameGradeClasses) {
        try {
          const response = await fetch(`/api/timetables/${classData.id}/auto-schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              options: {
                preserveExisting: false,
                balanceSubjects: true,
                respectTeacherPreferences: true
              }
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        showNotification('success', `Successfully auto-scheduled ${successCount} classes in Grade ${selectedClassData.gradeLevel}!`);
      } else {
        showNotification('error', `Auto-scheduled ${successCount} classes, but ${errorCount} failed. Please check individual classes.`);
      }

      // Refresh current timetable
      window.location.reload();

    } catch (error) {
      console.error('Error during bulk auto-schedule:', error);
      showNotification('error', 'Failed to auto-schedule classes. Please try again.');
    } finally {
      setAutoScheduling(false);
    }
  };

  // Export functionality
  const handleExport = (format: "pdf" | "excel") => {
    // Mock export - replace with actual implementation
    console.log(`Exporting timetable as ${format.toUpperCase()}`);
    alert(
      `Exporting timetable as ${format.toUpperCase()}... (Feature coming soon)`
    );
  };

  // Import functionality
  const handleImport = () => {
    // Mock import - replace with actual implementation
    console.log("Importing timetable...");
    alert("Import timetable feature coming soon");
  };

  const tabs = [
    { id: "timetable", label: "Timetables", icon: Calendar },
    { id: "special-days", label: "Special Days", icon: BookOpen },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Role-specific content rendering
  const renderRoleSpecificContent = () => {
    if (userInfo?.role === 'admin') {
      return renderAdminContent();
    } else {
      return renderUserContent();
    }
  };

  const renderUserContent = () => (
    <div className="space-y-6">
      {/* User Timetable Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {userInfo?.role === 'student' && '📚 My Timetable'}
              {userInfo?.role === 'parent' && '👨‍👩‍👧‍👦 Children\'s Timetables'}
              {userInfo?.role === 'teacher' && '🎓 My Teaching Schedule'}
            </h1>
            <p className="text-blue-100">
              {userInfo?.role === 'student' && 'View your weekly class schedule'}
              {userInfo?.role === 'parent' && 'View your children\'s weekly schedules'}
              {userInfo?.role === 'teacher' && 'View classes you teach'}
            </p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <div className="text-sm font-medium capitalize">{userInfo?.role}</div>
          </div>
        </div>
      </div>

      {/* Timetable Selection for Parents/Teachers with multiple classes */}
      {userTimetables.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            {userInfo?.role === 'parent' ? 'Select Child\'s Class' : 'Select Class'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {userTimetables.map((timetable) => (
              <button
                key={timetable.id}
                onClick={() => setSelectedTimetable(timetable)}
                className={`p-3 rounded-lg text-center font-medium transition-all ${
                  selectedTimetable?.id === timetable.id
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                <div className="text-sm">{timetable.class.name}</div>
                <div className="text-xs opacity-75">Grade {timetable.class.grade.level}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Display Selected Timetable */}
      {selectedTimetable ? (
        <TimetableView 
          timetable={selectedTimetable} 
          userRole={userInfo?.role} 
        />
      ) : userTimetables.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Timetables Available</h3>
          <p className="text-gray-500">
            {userInfo?.role === 'student' && 'Your class timetable hasn\'t been created yet.'}
            {userInfo?.role === 'parent' && 'No timetables found for your children\'s classes.'}
            {userInfo?.role === 'teacher' && 'You haven\'t been assigned to any classes yet.'}
          </p>
        </div>
      ) : null}
    </div>
  );

  const renderAdminContent = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EDUNOVA</h1>
                <p className="text-gray-600">Timetable Management System</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport("pdf")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </button>
              <button
                onClick={() => handleExport("excel")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </button>
              <button
                onClick={handleImport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "timetable" && (
          <div className="space-y-6">
            {/* Class Selector */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Select Class
              </h2>
              
              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Building className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">No active classes found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Make sure there are classes with enrolled students
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedClasses)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([gradeLevel, gradeClasses]) => (
                      <div key={gradeLevel}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-700">
                            Grade {gradeLevel}
                          </h3>
                          {selectedClass && classes.find(c => c.id === selectedClass)?.gradeLevel === parseInt(gradeLevel) && (
                            <button
                              onClick={handleBulkAutoSchedule}
                              disabled={autoScheduling}
                              className="px-3 py-1 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {autoScheduling ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                  <span>Auto-Scheduling...</span>
                                </>
                              ) : (
                                <>
                                  <span>🤖</span>
                                  <span>Auto-Schedule All Grade {gradeLevel}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                          {gradeClasses.map((cls) => (
                            <button
                              key={cls.id}
                              onClick={() => setSelectedClass(cls.id)}
                              className={`p-3 rounded-lg text-center font-medium transition-all ${
                                selectedClass === cls.id
                                  ? "bg-blue-600 text-white shadow-lg scale-105"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              <Users className="w-4 h-4 mx-auto mb-1" />
                              {cls.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Timetable Grid */}
            {selectedClass && (
              <div className="relative">
                {saving && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-700 font-medium">Saving timetable...</span>
                    </div>
                  </div>
                )}
                <ModernTimetableGrid
                  classId={selectedClass}
                  readOnly={false}
                  showConflicts={true}
                  onSave={async (timetableData) => {
                    console.log("Saving timetable:", timetableData);
                    try {
                      setSaving(true);
                      const response = await fetch(`/api/timetables/${selectedClass}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          slots: timetableData.slots,
                        }),
                      });

                      if (response.ok) {
                        showNotification('success', 'Timetable saved successfully!');
                      } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to save timetable');
                      }
                    } catch (error) {
                      console.error('Error saving timetable:', error);
                      showNotification('error', 'Failed to save timetable. Please try again.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "special-days" && <SpecialDaysManager />}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
              <h1 className="text-3xl font-bold mb-2">Timetable Analytics</h1>
              <p className="text-purple-100">
                Comprehensive insights and statistics
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Classes
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {classes.length}
                    </p>
                  </div>
                  <Building className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Timetables
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {classes.length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Periods per Day
                    </p>
                    <p className="text-3xl font-bold text-purple-600">8</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      School Hours
                    </p>
                    <p className="text-3xl font-bold text-orange-600">5h</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Grade Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(groupedClasses).map(
                    ([grade, gradeClasses]) => (
                      <div
                        key={grade}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-600">Grade {grade}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  (gradeClasses.length / classes.length) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {gradeClasses.length}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
                <div className="space-y-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day) => (
                      <div
                        key={day}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-600">{day}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600">
                            8 periods
                          </span>
                          <span className="text-xs text-gray-500">
                            08:30-13:30
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Additional Analytics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">System Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    98%
                  </div>
                  <div className="text-sm text-gray-600">
                    Timetable Efficiency
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                  <div className="text-sm text-gray-600">Active Conflicts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    100%
                  </div>
                  <div className="text-sm text-gray-600">Coverage Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return renderRoleSpecificContent();
};

export default TimetableManagementPage;
