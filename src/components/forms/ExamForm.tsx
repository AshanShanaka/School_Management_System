"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormDate from "./FormDate";
import FormTime from "./FormTime";
import { examSchema } from "@/lib/formValidationSchemas";
import { createExam, updateExam } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ExamForm = ({
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: data?.title || "",
      examTypeId: data?.examTypeId?.toString() || "",
      subjectId:
        data?.Subject?.id?.toString() || data?.subjectId?.toString() || "",
      teacherId: data?.Teacher?.id || data?.teacherId || "",
      startDate: data?.startTime
        ? new Date(data.startTime).toISOString().split("T")[0]
        : "",
      startTime: data?.startTime
        ? new Date(data.startTime).toTimeString().slice(0, 5)
        : "",
      endDate: data?.endTime
        ? new Date(data.endTime).toISOString().split("T")[0]
        : "",
      endTime: data?.endTime
        ? new Date(data.endTime).toTimeString().slice(0, 5)
        : "",
      duration: data?.duration || "",
      venue: data?.venue || "",
    },
  });

  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    const examData = {
      ...(data?.id && { id: data.id }),
      title: formData.title,
      examTypeId: parseInt(formData.examTypeId),
      subjectId: parseInt(formData.subjectId),
      teacherId: formData.teacherId,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
      duration: formData.duration,
      venue: formData.venue || undefined,
      day: undefined,
      subjectCode: undefined,
    };
    formAction(examData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(
        `Exam has been ${type === "create" ? "created" : "updated"}!`
      );
      setOpen(false);
      router.refresh();
    }
    if (state.error) {
      toast.error(
        typeof state.error === "string" ? state.error : "Something went wrong!"
      );
    }
  }, [state, router, type, setOpen]);

  const { subjects = [], teachers = [], examTypes = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new exam" : "Update the exam"}
      </h1>

      <div className="flex flex-wrap gap-4">
        <div className="w-full">
          <FormInput
            label="Title"
            name="title"
            register={register}
            error={errors.title}
          />
        </div>

        <FormSelect
          label="Exam Type"
          name="examTypeId"
          register={register}
          error={errors.examTypeId}
          options={examTypes.map((type: any) => ({
            value: type.id.toString(),
            label: type.name,
          }))}
        />

        <FormSelect
          label="Subject"
          name="subjectId"
          register={register}
          error={errors.subjectId}
          options={subjects.map((subject: any) => ({
            value: subject.id.toString(),
            label: subject.name,
          }))}
        />

        <FormSelect
          label="Supervisor"
          name="teacherId"
          register={register}
          error={errors.teacherId}
          options={teachers.map((teacher: any) => ({
            value: teacher.id,
            label: `${teacher.name} ${teacher.surname}`,
          }))}
        />

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

        <FormInput
          label="Duration (in minutes)"
          name="duration"
          register={register}
          error={errors.duration}
        />

        <div className="w-full">
          <FormInput
            label="Venue"
            name="venue"
            register={register}
            error={errors.venue}
          />
        </div>
      </div>

      {state.error && (
        <span className="text-red-500">
          {typeof state.error === "string"
            ? state.error
            : "Something went wrong!"}
        </span>
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;
