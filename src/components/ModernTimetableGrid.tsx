"use client";

import React from "react";

interface ModernTimetableGridProps {
  classId: number;
  readOnly?: boolean;
}

const ModernTimetableGrid: React.FC<ModernTimetableGridProps> = ({
  classId,
  readOnly = false,
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Modern Timetable Grid</h3>
      <p className="text-gray-600">
        Timetable grid for class {classId} - Component under development
      </p>
      {readOnly && (
        <p className="text-sm text-gray-500 mt-2">Read-only mode</p>
      )}
    </div>
  );
};

export default ModernTimetableGrid;
