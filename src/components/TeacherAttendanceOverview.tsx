import React from "react";

// Teacher Attendance Overview component
const TeacherAttendanceOverview = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="font-medium text-blue-800">Today's Classes</h4>
          <p className="text-2xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <h4 className="font-medium text-green-800">Present Students</h4>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-red-50 p-3 rounded">
          <h4 className="font-medium text-red-800">Absent Students</h4>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendanceOverview;
