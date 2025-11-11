"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { gradeSchema, GradeSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "@/hooks/useFormState";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createGrade, updateGrade } from "@/lib/actions";

const GradeForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GradeSchema>({
    resolver: zodResolver(gradeSchema),
  });

  // Wrapper functions to handle FormData conversion
  const createGradeAction = async (state: any, formData: FormData) => {
    const data = {
      level: parseInt(formData.get("level") as string),
    };
    return await createGrade(state, data);
  };

  const updateGradeAction = async (state: any, formData: FormData) => {
    const data = {
      id: parseInt(formData.get("id") as string),
      level: parseInt(formData.get("level") as string),
    };
    return await updateGrade(state, data);
  };

  const [state, formAction] = useFormState(
    type === "create" ? createGradeAction : updateGradeAction,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.append("level", data.level?.toString() || "");
    if (data.id) {
      formData.append("id", data.id.toString());
    }
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Grade has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new grade" : "Update the grade"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Grade Level"
          name="level"
          defaultValue={data?.level}
          register={register}
          error={errors?.level}
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

export default GradeForm;
