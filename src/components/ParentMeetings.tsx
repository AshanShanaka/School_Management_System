"use client";

import { useEffect, useState } from "react";
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
import SuccessNotification from "./SuccessNotification";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  duration: number;
  location: string | null;
  meetingType: string;
  status: string;
  notes: string | null;
  teacher: { name: string; surname: string; email: string | null; phone: string | null };
  student: { name: string; surname: string };
}

export default function ParentMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    description: '',
    scheduledDate: '',
    duration: 30,
    location: '',
    meetingType: 'IN_PERSON',
  });

  useEffect(() => {
    fetchMeetings();
    fetchChildren();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error fetching meetings:', data);
        alert(`Failed to load meetings: ${data.error || 'Unknown error'}`);
        return;
      }
      
      if (data.success) {
        setMeetings(data.meetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      alert('Failed to load meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/parent/children');
      const data = await res.json();
      if (data.success) {
        setChildren(data.children);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleRequestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedChild = children.find(c => c.id === formData.studentId);
    if (!selectedChild) {
      alert('Please select a child');
      return;
    }

    if (!selectedChild.classTeacherId) {
      alert('No class teacher assigned to this student. Please contact the school.');
      return;
    }

    console.log('Creating meeting with data:', {
      ...formData,
      teacherId: selectedChild.classTeacherId,
      parentId: selectedChild.parentId,
    });

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacherId: selectedChild.classTeacherId,
          parentId: selectedChild.parentId,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error creating meeting:', data);
        alert(`Failed to create meeting: ${data.error || 'Unknown error'}${data.missingFields ? '\nMissing: ' + data.missingFields.join(', ') : ''}`);
        return;
      }
      
      if (data.success) {
        setShowNewMeetingModal(false);
        setFormData({
          studentId: '',
          title: '',
          description: '',
          scheduledDate: '',
          duration: 30,
          location: '',
          meetingType: 'IN_PERSON',
        });
        fetchMeetings();
        setShowSuccessNotification(true);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  const filteredMeetings = meetings.filter((meeting) => {
    if (selectedFilter === "all") return true;
    return meeting.status === selectedFilter;
  });

  const upcomingMeetings = meetings.filter(
    (m) => m.status === "SCHEDULED" && new Date(m.scheduledDate) > new Date()
  );
  const completedMeetings = meetings.filter((m) => m.status === "COMPLETED");
  const cancelledMeetings = meetings.filter((m) => m.status === "CANCELLED");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3" />
            Scheduled
          </span>
        );
      case "RESCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" />
            Rescheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "CANCELLED":
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
      case "ONLINE":
        return <Video className="w-4 h-4 text-blue-600" />;
      case "PHONE":
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "IN_PERSON":
        return <MapPin className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    return type.replace('_', ' ');
  };

  if (loading) {
    return <div className="p-6">Loading meetings...</div>;
  }

  return (
    <>
      {/* Success Notification */}
      {showSuccessNotification && (
        <SuccessNotification
          title="Meeting Request Submitted!"
          message="The teacher will be notified about your meeting request."
          onClose={() => setShowSuccessNotification(false)}
        />
      )}

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
          <p className="text-xs text-gray-500 mt-2">Scheduled</p>
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
              { value: "SCHEDULED", label: "Scheduled" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
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
                        <span className="font-medium">
                          {meeting.teacher.name} {meeting.teacher.surname}
                        </span>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">
                          {meeting.student.name} {meeting.student.surname}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(meeting.scheduledDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(meeting.scheduledDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} ({meeting.duration} min)
                        </div>
                        <div className="flex items-center gap-1">
                          {getMeetingTypeIcon(meeting.meetingType)}
                          {getMeetingTypeLabel(meeting.meetingType)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(meeting.status)}
                </div>

                {meeting.description && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Description:</h4>
                    <p className="text-gray-700 text-sm">{meeting.description}</p>
                  </div>
                )}

                {meeting.location && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-purple-600" />
                    <span>
                      <strong>Location:</strong> {meeting.location}
                    </span>
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
            <form onSubmit={handleRequestMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Child *
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select child</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name} {child.surname} - Class {child.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Academic Progress Discussion"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-4 py-2"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type
                </label>
                <select
                  value={formData.meetingType}
                  onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="IN_PERSON">In-Person</option>
                  <option value="ONLINE">Online Meeting</option>
                  <option value="PHONE">Phone Call</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Room number, Zoom link, etc."
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the reason for this meeting..."
                  className="w-full border rounded-lg px-4 py-2"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
