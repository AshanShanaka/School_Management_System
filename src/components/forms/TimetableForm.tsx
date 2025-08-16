"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { createTimetable, updateTimetable } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import SelectField from "../SelectField";

const schema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Timetable name is required!" }),
  academicYear: z.string().min(1, { message: "Academic year is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  isActive: z.boolean().optional(),
});

type Inputs = z.infer<typeof schema>;

const TimetableForm = ({
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
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  const [state, formAction] = useFormState(
    type === "create" ? createTimetable : updateTimetable,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast(`Timetable has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { classes } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new timetable" : "Update the timetable"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Timetable Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Academic Year"
          name="academicYear"
          defaultValue={data?.academicYear}
          register={register}
          error={errors?.academicYear}
          placeholder="e.g., 2024-2025"
        />
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <SelectField
          label="Class"
          name="classId"
          register={register}
          error={errors?.classId}
          options={classes.map((classItem: any) => ({
            value: classItem.id,
            label: `Grade ${classItem.grade.level} - ${classItem.name}`,
          }))}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Status</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isActive")}
              defaultChecked={data?.isActive}
              className="w-4 h-4"
            />
            <span className="text-sm">Active</span>
          </div>
        </div>
      </div>

      {data && (
        <InputField
          label="ID"
          name="id"
          defaultValue={data?.id}
          register={register}
          error={errors?.id}
          hidden
        />
      )}

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default TimetableForm;
