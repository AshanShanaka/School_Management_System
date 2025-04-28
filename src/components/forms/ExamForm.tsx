"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Exam, Subject, Teacher } from "@prisma/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExam, updateExam, deleteExam } from "@/actions/exam";
import { toast } from "sonner";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormDate from "./FormDate";
import FormTime from "./FormTime";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  examType: z.string().min(1, "Exam type is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Supervisor is required"),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
});

type ExamFormValues = z.infer<typeof examSchema>;

interface ExamFormProps {
  exam?: Exam;
  onSuccess?: () => void;
  type?: "create" | "update";
  setOpen?: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
  data?: any; // Added the missing data prop
}

export default function ExamForm({
  exam,
  onSuccess,
  type,
  setOpen,
  relatedData,
}: ExamFormProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: exam?.title || "",
      examType: exam?.examTypeId?.toString() || "",
      subjectId: exam?.subjectId?.toString() || "",
      teacherId: exam?.teacherId || "",
      startDate: exam?.startTime
        ? new Date(exam.startTime).toISOString().split("T")[0]
        : "",
      startTime: exam?.startTime
        ? new Date(exam.startTime).toTimeString().slice(0, 5)
        : "",
      endDate: exam?.endTime
        ? new Date(exam.endTime).toISOString().split("T")[0]
        : "",
      endTime: exam?.endTime
        ? new Date(exam.endTime).toTimeString().slice(0, 5)
        : "",
      venue: exam?.venue || "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const [deleteState, deleteAction] = useFormState(deleteExam, {
    success: false,
    error: false,
  });

  const onSubmit = handleSubmit((data: ExamFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (exam?.id) {
        formData.append("id", exam.id.toString());
      }
      formData.append("title", data.title);
      formData.append("examType", data.examType);
      formData.append("subjectId", data.subjectId);
      formData.append("teacherId", data.teacherId);
      formData.append("startTime", `${data.startDate}T${data.startTime}`);
      formData.append("endTime", `${data.endDate}T${data.endTime}`);
      formData.append(
        "duration",
        Math.round(
          (new Date(`${data.endDate}T${data.endTime}`).getTime() -
            new Date(`${data.startDate}T${data.startTime}`).getTime()) /
            (1000 * 60)
        ).toString()
      );
      formData.append("venue", data.venue);

      console.log(
        "Submitting form with data:",
        Object.fromEntries(formData.entries())
      );
      formAction(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
      setIsLoading(false);
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Exam ${type === "create" ? "created" : "updated"} successfully`
      );
      setOpen?.(false);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } else if (state.error) {
      toast.error("Failed to submit form");
    }
    setIsLoading(false);
  }, [state, router, type, setOpen, onSuccess]);

  useEffect(() => {
    if (deleteState.success) {
      toast.success("Exam deleted successfully");
      setOpen?.(false);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    } else if (deleteState.error) {
      toast.error("Failed to delete exam");
    }
    setIsLoading(false);
  }, [deleteState, router, setOpen, onSuccess]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsResponse, teachersResponse] = await Promise.all([
          fetch("/api/subjects"),
          fetch("/api/teachers"),
        ]);

        if (!subjectsResponse.ok || !teachersResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [subjectsData, teachersData] = await Promise.all([
          subjectsResponse.json(),
          teachersResponse.json(),
        ]);

        setSubjects(subjectsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };

    fetchData();
  }, []);

  return (
    <form onSubmit={onSubmit} className="w-full h-full space-y-1.5 p-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <FormInput
          label="Title"
          name="title"
          register={register}
          error={errors.title}
        />

        <FormInput
          label="Exam Type"
          name="examType"
          register={register}
          error={errors.examType}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FormSelect
          label="Subject"
          name="subjectId"
          register={register}
          error={errors.subjectId}
          options={subjects.map((subject) => ({
            value: subject.id.toString(),
            label: subject.name,
          }))}
        />

        <FormSelect
          label="Supervisor"
          name="teacherId"
          register={register}
          error={errors.teacherId}
          options={teachers.map((teacher) => ({
            value: teacher.id,
            label: teacher.name,
          }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid grid-cols-2 gap-2">
          <FormDate
            label="Start Date"
            name="startDate"
            register={register}
            error={errors.startDate}
          />
          <FormTime
            label="Start Time"
            name="startTime"
            register={register}
            error={errors.startTime}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormDate
            label="End Date"
            name="endDate"
            register={register}
            error={errors.endDate}
          />
          <FormTime
            label="End Time"
            name="endTime"
            register={register}
            error={errors.endTime}
          />
        </div>
      </div>

      <FormInput
        label="Venue"
        name="venue"
        register={register}
        error={errors.venue}
      />

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-lamaPurple text-white py-1.5 px-3 rounded-md hover:bg-lamaPurpleDark transition-colors disabled:opacity-50 text-xs"
        >
          {isLoading ? "Saving..." : type === "create" ? "Create" : "Update"}
        </button>

        {type === "update" && exam?.id && (
          <button
            type="button"
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 text-xs"
            onClick={async (e) => {
              e.preventDefault();
              const confirmDelete = confirm(
                "Are you sure you want to delete this exam?"
              );
              if (confirmDelete) {
                setIsLoading(true);
                try {
                  const formData = new FormData();
                  formData.append("id", exam.id.toString());
                  await deleteAction(formData);
                } catch (error) {
                  console.error("Error deleting exam:", error);
                  toast.error("Failed to delete exam");
                } finally {
                  setIsLoading(false);
                }
              }
            }}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </form>
  );
}
