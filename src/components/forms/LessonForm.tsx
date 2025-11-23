"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useFormState } from "@/hooks/useFormState";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
// TODO: Replace useAuth with custom auth hook

const LessonForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  console.log("🎯 LessonForm loaded!", { type, hasData: !!data, relatedData });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
    defaultValues: data
      ? {
          id: data.id,
          name: data.name,
          day: data.day,
          startTime: data.startTime ? new Date(data.startTime) : new Date(),
          endTime: data.endTime ? new Date(data.endTime) : new Date(),
          subjectId: data.subjectId,
          classId: data.classId,
          teacherId: data.teacherId,
        }
      : {
          name: "",
          day: "MONDAY",
          startTime: new Date(),
          endTime: new Date(),
          subjectId: 0,
          classId: 0,
          teacherId: "",
        },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createLesson : updateLesson,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const { subjects = [], classes = [] } = relatedData || {};
  const { user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;

  console.log("📊 Form State:", { user, userId, userRole, subjectsCount: subjects.length, classesCount: classes.length });

  // Filter subjects to show only those assigned to the teacher
  const teacherSubjects = subjects.filter((subject: any) =>
    subject.teachers?.some((teacher: any) => teacher.id === userId)
  );

  // For teachers, get their first assigned subject (they should only have one as subject teacher)
  const teacherAssignedSubject = teacherSubjects.length > 0 ? teacherSubjects[0] : null;

  // Safety check: If no subjects or classes, show error
  if (!subjects || subjects.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold text-red-600">Error Loading Form</h1>
        <p className="mt-2">No subjects found. Please ensure subjects are created in the system.</p>
        <button
          onClick={() => setOpen(false)}
          className="mt-4 bg-gray-400 text-white p-2 rounded-md"
        >
          Close
        </button>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold text-red-600">Error Loading Form</h1>
        <p className="mt-2">No classes found. Please ensure classes are created in the system.</p>
        <button
          onClick={() => setOpen(false)}
          className="mt-4 bg-gray-400 text-white p-2 rounded-md"
        >
          Close
        </button>
      </div>
    );
  }

  const onSubmit = handleSubmit((formData) => {
    console.log("Submitting lesson data:", formData);
    
    // If teacher and creating new lesson, automatically set their subject and teacherId
    if (userRole === "teacher" && type === "create") {
      if (teacherAssignedSubject) {
        formData.subjectId = teacherAssignedSubject.id;
      }
      // Auto-assign the teacher's own ID
      if (userId) {
        formData.teacherId = userId;
      }
    }
    
    // Create FormData object from the parsed data
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle Date objects specially
        if (value instanceof Date) {
          form.append(key, value.toISOString());
        } else {
          form.append(key, value.toString());
        }
      }
    });
    formAction(form);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Lesson has been ${
          type === "create" ? "created" : "updated"
        } successfully!`,
        {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error(
        typeof state.error === "string"
          ? state.error
          : "Failed to create/update lesson. Please try again.",
        {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : "Update the lesson"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Lesson name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Day</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("day")}
            defaultValue={data?.day}
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
          </select>
          {errors.day?.message && (
            <p className="text-xs text-red-400">
              {errors.day.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Start Time</label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("startTime")}
            defaultValue={
              data?.startTime
                ? new Date(data.startTime).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16)
            }
          />
          {errors.startTime?.message && (
            <p className="text-xs text-red-400">
              {errors.startTime.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">End Time</label>
          <input
            type="datetime-local"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("endTime")}
            defaultValue={
              data?.endTime
                ? new Date(data.endTime).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16)
            }
          />
          {errors.endTime?.message && (
            <p className="text-xs text-red-400">
              {errors.endTime.message.toString()}
            </p>
          )}
        </div>
        
        {/* Subject Field - Hidden for teachers, shown for admins */}
        {userRole === "admin" ? (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Subject</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("subjectId")}
              defaultValue={data?.subjectId}
            >
              {subjects.map((subject: { id: number; name: string }) => (
                <option value={subject.id} key={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subjectId?.message && (
              <p className="text-xs text-red-400">
                {errors.subjectId.message.toString()}
              </p>
            )}
          </div>
        ) : (
          // For teachers, show their assigned subject as read-only
          teacherAssignedSubject && (
            <div className="flex flex-col gap-2 w-full md:w-1/4">
              <label className="text-xs text-gray-500">Subject</label>
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100 cursor-not-allowed"
                value={teacherAssignedSubject.name}
                disabled
                readOnly
              />
              <input
                type="hidden"
                {...register("subjectId")}
                value={teacherAssignedSubject.id}
              />
              <p className="text-xs text-gray-500">
                (Auto-assigned based on your subject)
              </p>
            </div>
          )
        )}
        
        {/* Hidden teacher ID field - auto-assigned for teachers, admin needs to select */}
        {userRole === "teacher" ? (
          <input
            type="hidden"
            {...register("teacherId")}
            value={userId || ""}
          />
        ) : null}
        
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            defaultValue={data?.classId}
          >
            {classes.map((classItem: { id: number; name: string }) => (
              <option value={classItem.id} key={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>
      </div>
      {state?.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default LessonForm;
