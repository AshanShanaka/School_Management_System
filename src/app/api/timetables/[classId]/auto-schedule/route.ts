import { NextRequest, NextResponse } from "next/server";
import { timetableService } from "@/lib/modernTimetableService";

// POST /api/timetables/[classId]/auto-schedule - Auto-schedule timetable
export async function POST(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = parseInt(params.classId);
    const body = await request.json();
    const options = body.options || {};

    // Auto-schedule the timetable
    const scheduledTimetable = await timetableService.autoScheduleTimetable(
      classId,
      options
    );

    return NextResponse.json(scheduledTimetable);
  } catch (error) {
    console.error("Error auto-scheduling timetable:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
