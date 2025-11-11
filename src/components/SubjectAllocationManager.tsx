"use client";

import { useState, useEffect } from "react";
import { Book, Users, Clock, Save, RefreshCw, AlertCircle } from "lucide-react";

interface Subject {
  id: number;
  name: string;
  color?: string;
}

interface Grade {
  id: number;
  level: number;
}

interface Class {
  id: number;
  name: string;
  gradeId: number;
  grade: Grade;
}

interface SubjectAllocation {
  id?: number;
  subjectId: number;
  subject: Subject;
  periodsPerWeek: number;
  gradeId: number;
  classId: number;
}

interface SubjectAllocationManagerProps {
  classId: number;
  className: string;
  gradeLevel: number;
  onAllocationSaved?: () => void;
}

const SubjectAllocationManager = ({ 
  classId, 
  className, 
  gradeLevel,
  onAllocationSaved 
}: SubjectAllocationManagerProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allocations, setAllocations] = useState<SubjectAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subjects and existing allocations
  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load subjects
      const subjectsResponse = await fetch('/api/subjects');
      const subjectsData = await subjectsResponse.json();
      setSubjects(subjectsData);

      // Load existing allocations for this class
      const allocationsResponse = await fetch(
        `/api/subject-allocations?classId=${classId}`
      );
      const allocationsData = await allocationsResponse.json();
      setAllocations(allocationsData);

      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateAllocation = (subjectId: number, periods: number) => {
    setAllocations(prev => {
      const existing = prev.find(a => a.subjectId === subjectId);
      if (existing) {
        return prev.map(a => 
          a.subjectId === subjectId 
            ? { ...a, periodsPerWeek: periods }
            : a
        );
      } else {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
          return [...prev, {
            subjectId,
            subject,
            periodsPerWeek: periods,
            gradeId: gradeLevel,
            classId
          }];
        }
        return prev;
      }
    });
  };

  const removeAllocation = (subjectId: number) => {
    setAllocations(prev => prev.filter(a => a.subjectId !== subjectId));
  };

  const getTotalPeriods = () => {
    return allocations.reduce((sum, allocation) => sum + allocation.periodsPerWeek, 0);
  };

  const saveAllocations = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/subject-allocations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allocations }),
      });

      if (!response.ok) {
        throw new Error('Failed to save allocations');
      }

      setError(null);
      onAllocationSaved?.();
    } catch (error) {
      console.error('Error saving allocations:', error);
      setError('Failed to save allocations');
    } finally {
      setSaving(false);
    }
  };

  const totalPeriods = getTotalPeriods();
  const isValid = totalPeriods === 30;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <Book className="w-5 h-5 mr-2 text-blue-600" />
            Subject Allocations
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {className} (Grade {gradeLevel}) - Set periods per week for each subject
          </p>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {totalPeriods}/30 periods
          </div>
          <div className="text-sm text-gray-500">
            5 days × 6 periods
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {!isValid && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Total periods must equal 30 to generate a complete timetable
        </div>
      )}

      <div className="space-y-4">
        {subjects.map(subject => {
          const allocation = allocations.find(a => a.subjectId === subject.id);
          const periods = allocation?.periodsPerWeek || 0;

          return (
            <div key={subject.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: subject.color || '#6B7280' }}
                />
                <div>
                  <h3 className="font-medium text-gray-900">{subject.name}</h3>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Periods per week:</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateAllocation(subject.id, Math.max(0, periods - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                    disabled={periods <= 0}
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={periods}
                    onChange={(e) => updateAllocation(subject.id, parseInt(e.target.value) || 0)}
                    className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                  />
                  
                  <button
                    onClick={() => updateAllocation(subject.id, periods + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                    disabled={totalPeriods >= 30}
                  >
                    +
                  </button>
                </div>

                {periods > 0 && (
                  <button
                    onClick={() => removeAllocation(subject.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <button
          onClick={saveAllocations}
          disabled={saving || !isValid}
          className={`px-6 py-2 rounded-lg flex items-center font-medium ${
            isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? 'Saving...' : 'Save Allocations'}
        </button>
      </div>
    </div>
  );
};

export default SubjectAllocationManager;
