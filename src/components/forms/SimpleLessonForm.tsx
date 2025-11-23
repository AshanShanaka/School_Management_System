"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const SimpleLessonForm = ({
  type,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  setOpen: (open: boolean) => void;
  relatedData?: any;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          day: formData.get("day"),
          startTime: formData.get("startTime"),
          endTime: formData.get("endTime"),
          subjectId: parseInt(formData.get("subjectId") as string),
          classId: parseInt(formData.get("classId") as string),
        }),
      });

      if (response.ok) {
        toast.success("Lesson created successfully!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to create lesson");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error creating lesson");
    } finally {
      setLoading(false);
    }
  };

  const subjects = relatedData?.subjects || [];
  const classes = relatedData?.classes || [];

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Create New Lesson</h1>

      {/* Lesson Name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">Lesson Name</label>
        <input
          name="name"
          type="text"
          placeholder="e.g., Algebra Basics"
          required
          className="ring-1 ring-gray-300 p-2 rounded-md"
        />
      </div>

      {/* Day */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">Day</label>
        <select name="day" required className="ring-1 ring-gray-300 p-2 rounded-md">
          <option value="MONDAY">Monday</option>
          <option value="TUESDAY">Tuesday</option>
          <option value="WEDNESDAY">Wednesday</option>
          <option value="THURSDAY">Thursday</option>
          <option value="FRIDAY">Friday</option>
        </select>
      </div>

      {/* Start Time */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">Start Time</label>
        <input
          name="startTime"
          type="time"
          required
          className="ring-1 ring-gray-300 p-2 rounded-md"
        />
      </div>

      {/* End Time */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">End Time</label>
        <input
          name="endTime"
          type="time"
          required
          className="ring-1 ring-gray-300 p-2 rounded-md"
        />
      </div>

      {/* Subject */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">Subject</label>
        <select name="subjectId" required className="ring-1 ring-gray-300 p-2 rounded-md">
          <option value="">Select Subject</option>
          {subjects.map((subject: any) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Class */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">Class</label>
        <select name="classId" required className="ring-1 ring-gray-300 p-2 rounded-md">
          <option value="">Select Class</option>
          {classes.map((cls: any) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
        >
          {loading ? "Creating..." : "Create Lesson"}
        </button>
      </div>
    </form>
  );
};

export default SimpleLessonForm;
