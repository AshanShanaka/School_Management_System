"use client";

import dynamic from "next/dynamic";

// Dynamically import with no SSR to avoid hydration issues
const DailyAttendanceForm = dynamic(
  () => import("./DailyAttendanceForm").then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }
);

interface AdminAttendanceClientProps {
  classId: number;
}

export default function AdminAttendanceClient({ classId }: AdminAttendanceClientProps) {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <DailyAttendanceForm initialClassId={classId} isAdmin={true} />
      </div>
    </div>
  );
}
