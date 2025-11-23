"use client";

import { useEffect, useState } from "react";
import SuccessNotification from "@/components/SuccessNotification";

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
  parent: { name: string; surname: string; email: string | null; phone: string | null };
  student: { name: string; surname: string };
}

export default function ClassTeacherMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
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
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/class-teacher/students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedStudent = students.find(s => s.id === formData.studentId);
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!selectedStudent.classTeacherId) {
      alert('Class teacher ID not found. Please try again.');
      return;
    }

    console.log('Creating meeting with data:', {
      ...formData,
      teacherId: selectedStudent.classTeacherId,
      parentId: selectedStudent.parentId,
    });

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacherId: selectedStudent.classTeacherId, // Current user
          parentId: selectedStudent.parentId,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error creating meeting:', data);
        alert(`Failed to create meeting: ${data.error || 'Unknown error'}${data.missingFields ? '\nMissing: ' + data.missingFields.join(', ') : ''}`);
        return;
      }
      
      if (data.success) {
        setShowCreateModal(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'RESCHEDULED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'ONLINE': return '💻';
      case 'PHONE': return '📞';
      default: return '🏫';
    }
  };

  if (loading) {
    return <div className="p-6">Loading meetings...</div>;
  }

  return (
    <>
      {/* Success Notification */}
      {showSuccessNotification && (
        <SuccessNotification
          title="Meeting Scheduled Successfully!"
          message="The parent has been notified about the meeting."
          onClose={() => setShowSuccessNotification(false)}
        />
      )}

      <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Meetings</h1>
          <p className="text-gray-600 mt-1">Schedule and manage meetings with parents</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Schedule Meeting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Meetings</div>
          <div className="text-3xl font-bold text-gray-900">{meetings.length}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 shadow">
          <div className="text-sm font-medium text-blue-600 mb-1">Scheduled</div>
          <div className="text-3xl font-bold text-blue-900">
            {meetings.filter(m => m.status === 'SCHEDULED').length}
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-5 shadow">
          <div className="text-sm font-medium text-green-600 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-900">
            {meetings.filter(m => m.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-5 shadow">
          <div className="text-sm font-medium text-yellow-600 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-900">
            {meetings.filter(m => m.status === 'SCHEDULED' && new Date(m.scheduledDate) > new Date()).length}
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Student</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Parent</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Title</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Date & Time</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Type</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">
                      {meeting.student.name} {meeting.student.surname}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">
                      {meeting.parent.name} {meeting.parent.surname}
                    </div>
                    {meeting.parent.phone && (
                      <div className="text-sm text-gray-500">📞 {meeting.parent.phone}</div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{meeting.title}</div>
                    {meeting.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{meeting.description}</div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">
                      {new Date(meeting.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(meeting.scheduledDate).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} ({meeting.duration} min)
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMeetingTypeIcon(meeting.meetingType)}</span>
                      <span className="text-sm text-gray-700">{meeting.meetingType.replace('_', ' ')}</span>
                    </div>
                    {meeting.location && (
                      <div className="text-xs text-gray-500 mt-1">📍 {meeting.location}</div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule New Meeting</h2>
            
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student *
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} {student.surname} - Parent: {student.parent?.name} {student.parent?.surname}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Academic Progress Discussion"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional details about the meeting..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IN_PERSON">In Person</option>
                    <option value="ONLINE">Online</option>
                    <option value="PHONE">Phone Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Room 101 / Zoom Link"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Schedule Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
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
