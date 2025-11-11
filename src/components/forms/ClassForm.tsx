"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  classSchema,
  ClassSchema,
  subjectSchema,
  SubjectSchema,
} from "@/lib/formValidationSchemas";
import {
  createClass,
  createSubject,
  updateClass,
  updateSubject,
  CurrentState,
} from "@/lib/actions";
import { useFormState } from "@/hooks/useFormState";
import { Dispatch, SetStateAction, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const ClassForm = ({
  type,
  data,
  setOpen,
  relatedData,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
  onSuccess?: () => void;
}) => {
  console.log("ClassForm props:", { type, data, relatedData });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: data
      ? {
          id: data.id,
          name: data.name,
          capacity: data.capacity,
          gradeId: data.gradeId,
          supervisorId: data.supervisorId,
        }
      : {
          name: "",
          capacity: 0,
          gradeId: 0,
          supervisorId: "",
        },
  });

  // AFTER REACT 19 IT'LL BE USEACTIONSTATE

  const [state, formAction] = useFormState(
    async (state: CurrentState, formData: FormData) => {
      // Convert FormData to ClassSchema
      const data: ClassSchema = {
        name: formData.get("name") as string,
        capacity: parseInt(formData.get("capacity") as string),
        gradeId: parseInt(formData.get("gradeId") as string),
        supervisorId: formData.get("supervisorId") as string,
      };
      
      // Add ID for updates from FormData
      if (type === "update") {
        const idValue = formData.get("id");
        if (idValue) {
          data.id = parseInt(idValue as string);
        }
      }
      
      console.log("Action data:", data, "Type:", type);
      
      return type === "create"
        ? createClass(state, data)
        : updateClass(state, data);
    },
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit(async (formData) => {
    console.log("Submitting class data:", formData);
    console.log("Type:", type, "Data:", data);
    // Create FormData object for the action
    const form = new FormData();
    form.append("name", formData.name || "");
    form.append("capacity", formData.capacity?.toString() || "");
    form.append("gradeId", formData.gradeId?.toString() || "");
    form.append("supervisorId", formData.supervisorId || "");
    
    // Add ID for updates - it should come from the data prop
    if (type === "update" && data?.id) {
      form.append("id", data.id.toString());
    }
    
    formAction(form);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Class has been ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      if (onSuccess) {
        onSuccess(); // Call the refresh function from parent
      }
      router.refresh();
    }
    if (state.error) {
      toast.error(`Failed to ${type === "create" ? "create" : "update"} class. Please try again.`);
    }
  }, [state, router, type, setOpen, onSuccess]);

  const { teachers, grades } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new class" : "Update the class"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Class name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Capacity"
          name="capacity"
          type="number"
          defaultValue={data?.capacity}
          register={register}
          error={errors?.capacity}
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
          <label className="text-xs text-gray-500">Supervisor</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("supervisorId")}
            defaultValue={data?.supervisorId || ""}
          >
            <option value="">Select a supervisor</option>
            {Array.isArray(teachers) && teachers.map(
              (teacher: { id: string; name: string; surname: string }) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.name + " " + teacher.surname}
                </option>
              )
            )}
          </select>
          {errors.supervisorId?.message && (
            <p className="text-xs text-red-400">
              {errors.supervisorId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Grade</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradeId", { valueAsNumber: true })}
            defaultValue={data?.gradeId || ""}
          >
            <option value="">Select a grade</option>
            {grades.map((grade: { id: number; level: number }) => (
              <option value={grade.id} key={grade.id}>
                Grade {grade.level}
              </option>
            ))}
          </select>
          {errors.gradeId?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeId.message.toString()}
            </p>
          )}
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ClassForm;
