"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  teacherName: string;
  teacherSubject: string;
  date: string;
  time: string;
  duration: string;
  type: "in-person" | "online" | "phone";
  location?: string;
  meetingLink?: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  purpose: string;
  notes?: string;
  studentName: string;
}

// Mock meeting data for parent
const MOCK_MEETINGS: Meeting[] = [
  {
    id: "1",
    title: "Academic Progress Discussion",
    teacherName: "Mr. Kasun Silva",
    teacherSubject: "Mathematics",
    date: "2025-10-25",
    time: "02:00 PM",
    duration: "30 minutes",
    type: "in-person",
    location: "Room 201, Main Building",
    status: "scheduled",
    purpose: "Discuss student's progress in Mathematics and upcoming exam preparation",
    studentName: "Kasun Perera",
  },
  {
    id: "2",
    title: "Behavior and Conduct Review",
    teacherName: "Mrs. Nimal Perera",
    teacherSubject: "English",
    date: "2025-10-28",
    time: "10:00 AM",
    duration: "20 minutes",
    type: "online",
    meetingLink: "https://zoom.us/j/123456789",
    status: "scheduled",
    purpose: "Review student's classroom behavior and participation",
    studentName: "Kasun Perera",
  },
  {
    id: "3",
    title: "Science Project Consultation",
    teacherName: "Mr. Kasun Silva",
    teacherSubject: "Science",
    date: "2025-10-30",
    time: "03:30 PM",
    duration: "45 minutes",
    type: "in-person",
    location: "Science Lab 2",
    status: "pending",
    purpose: "Discuss upcoming science fair project and requirements",
    studentName: "Kasun Perera",
  },
  {
    id: "4",
    title: "Term Progress Report",
    teacherName: "Mrs. Sanduni Fernando",
    teacherSubject: "History",
    date: "2025-10-15",
    time: "11:00 AM",
    duration: "30 minutes",
    type: "phone",
    status: "completed",
    purpose: "Review first term performance and areas for improvement",
    notes: "Student showing good progress. Recommended more reading on world history topics.",
    studentName: "Kasun Perera",
  },
  {
    id: "5",
    title: "Attendance Discussion",
    teacherName: "Mr. Ruwan Bandara",
    teacherSubject: "Sinhala",
    date: "2025-10-10",
    time: "09:00 AM",
    duration: "15 minutes",
    type: "in-person",
    location: "Staff Room",
    status: "completed",
    purpose: "Address recent attendance issues",
    notes: "Attendance improved. No further concerns at this time.",
    studentName: "Kasun Perera",
  },
  {
    id: "6",
    title: "Career Guidance Session",
    teacherName: "Mrs. Thilini Jayasinghe",
    teacherSubject: "Religion",
    date: "2025-10-20",
    time: "01:00 PM",
    duration: "30 minutes",
    type: "online",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    status: "cancelled",
    purpose: "Discuss A/L subject selection and career options",
    notes: "Rescheduled to next month due to teacher's schedule conflict.",
    studentName: "Kasun Perera",
  },
];

export default function ParentMeetingsDemo() {
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);

  const filteredMeetings = meetings.filter((meeting) => {
    if (selectedFilter === "all") return true;
    return meeting.status === selectedFilter;
  });

  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled" || m.status === "pending"
  );
  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const cancelledMeetings = meetings.filter((m) => m.status === "cancelled");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3" />
            Scheduled
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" />
            Pending Confirmation
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "online":
        return <Video className="w-4 h-4 text-blue-600" />;
      case "phone":
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "in-person":
        return <MapPin className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case "online":
        return "Online Meeting";
      case "phone":
        return "Phone Call";
      case "in-person":
        return "In-Person";
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Parent-Teacher Meetings</h1>
            <p className="text-purple-100">
              Schedule and manage meetings with your child's teachers
            </p>
          </div>
          <button
            onClick={() => setShowNewMeetingModal(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors font-medium flex items-center gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" />
            Request Meeting
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Total Meetings</p>
              <p className="text-3xl font-bold text-gray-900">{meetings.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-3xl font-bold text-blue-600">
                {upcomingMeetings.length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Scheduled & Pending</p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {completedMeetings.length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Successfully held</p>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-3xl font-bold text-red-600">
                {cancelledMeetings.length}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Not completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All Meetings" },
              { value: "scheduled", label: "Scheduled" },
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedFilter === filter.value
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No meetings found
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedFilter === "all"
                ? "You don't have any scheduled meetings yet."
                : `No ${selectedFilter} meetings found.`}
            </p>
            <button
              onClick={() => setShowNewMeetingModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Request a Meeting
            </button>
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{meeting.teacherName}</span>
                        <span>•</span>
                        <span>{meeting.teacherSubject}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">
                          {meeting.studentName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(meeting.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meeting.time} ({meeting.duration})
                        </div>
                        <div className="flex items-center gap-1">
                          {getMeetingTypeIcon(meeting.type)}
                          {getMeetingTypeLabel(meeting.type)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(meeting.status)}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Purpose:</h4>
                  <p className="text-gray-700 text-sm">{meeting.purpose}</p>
                </div>

                {meeting.location && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-purple-600" />
                    <span>
                      <strong>Location:</strong> {meeting.location}
                    </span>
                  </div>
                )}

                {meeting.meetingLink && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <Video className="w-4 h-4 mt-0.5 text-blue-600" />
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Join Online Meeting
                    </a>
                  </div>
                )}

                {meeting.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Notes:
                    </h4>
                    <p className="text-amber-800 text-sm">{meeting.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {meeting.status === "scheduled" && (
                    <>
                      <button className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                        View Details
                      </button>
                      <button className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium">
                        Cancel Meeting
                      </button>
                    </>
                  )}
                  {meeting.status === "pending" && (
                    <button className="flex-1 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors font-medium">
                      Waiting for Confirmation
                    </button>
                  )}
                  {meeting.status === "completed" && (
                    <button className="flex-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors font-medium">
                      View Summary
                    </button>
                  )}
                  {meeting.status === "cancelled" && (
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                      Request Reschedule
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Meeting Request Modal */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-purple-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">Request New Meeting</h2>
              <p className="text-purple-100 mt-1">
                Fill in the details to request a meeting with a teacher
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Teacher
                </label>
                <select className="w-full border rounded-lg px-4 py-2">
                  <option>Mr. Kasun Silva - Mathematics</option>
                  <option>Mrs. Nimal Perera - English</option>
                  <option>Mr. Kasun Silva - Science</option>
                  <option>Mrs. Sanduni Fernando - History</option>
                  <option>Mr. Ruwan Bandara - Sinhala</option>
                  <option>Mrs. Thilini Jayasinghe - Religion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Academic Progress Discussion"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <input type="date" className="w-full border rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <input type="time" className="w-full border rounded-lg px-4 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type
                </label>
                <select className="w-full border rounded-lg px-4 py-2">
                  <option value="in-person">In-Person</option>
                  <option value="online">Online Meeting</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose of Meeting
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the reason for this meeting..."
                  className="w-full border rounded-lg px-4 py-2"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewMeetingModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Meeting request submitted!");
                    setShowNewMeetingModal(false);
                  }}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
