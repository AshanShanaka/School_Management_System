"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "@/hooks/useFormState";
import { createParent, updateParent, deleteParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import PasswordStrengthIndicator from "../PasswordStrengthIndicator";

const ParentForm = ({
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
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
    defaultValues: data
      ? {
          ...data,
          birthday: data.birthday
            ? new Date(data.birthday).toISOString().split("T")[0]
            : undefined,
          password: "",
        }
      : undefined,
  });

  const [img, setImg] = useState<any>(data?.img || null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const [state, formAction] = useFormState(
    type === "create" ? createParent : updateParent,
    { success: false, error: false, message: "" }
  );

  const [deleteState, deleteAction] = useFormState(deleteParent, {
    success: false,
    error: false,
    message: "",
  });

  const onSubmit = handleSubmit((formData) => {
    const submitData = {
      ...formData,
      img: img?.secure_url || data?.img || null,
      birthday: new Date(formData.birthday),
    };
    formAction(submitData);
  });

  useEffect(() => {
    if (state.success) {
      toast(
        state.message ||
          `Parent has been ${type === "create" ? "created" : "updated"}!`
      );
      setOpen(false);
      router.refresh();
    } else if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, router, type, setOpen]);

  useEffect(() => {
    if (deleteState.success) {
      toast(deleteState.message || "Parent has been deleted!");
      setOpen(false);
      router.refresh();
    } else if (deleteState.error && deleteState.message) {
      toast.error(deleteState.message);
    }
  }, [deleteState, router, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new parent" : "Update the parent"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Parent Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors.email}
        />
        <InputField
          label="Parent Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors.username}
        />
        {type === "create" && (
          <div className="w-full md:w-[45%]">
            <InputField
              label="Parent Password"
              name="password"
              type="password"
              register={register}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && <PasswordStrengthIndicator password={password} />}
          </div>
        )}
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Parent Information
      </span>
      <CldUploadWidget
        uploadPreset="school"
        onSuccess={(result: any) => {
          setImg(result.info);
        }}
      >
        {({ open }) => (
          <div
            className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
            onClick={() => open?.()}
          >
            <Image src="/upload.png" alt="" width={28} height={28} />
            <span>Upload a photo</span>
          </div>
        )}
      </CldUploadWidget>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Parent First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Parent Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Parent Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Parent Birthday"
          name="birthday"
          type="date"
          defaultValue={
            data?.birthday
              ? new Date(data.birthday).toISOString().split("T")[0]
              : undefined
          }
          register={register}
          error={errors.birthday}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Parent Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors.id}
            hidden
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
          {type === "create" ? "Create" : "Update"}
        </button>
        {type === "update" && data?.id && (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={data.id} />
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded-md"
              onClick={(event) => {
                const confirmDelete = confirm(
                  "Are you sure you want to delete this parent?"
                );
                if (!confirmDelete) {
                  event.preventDefault();
                }
              }}
            >
              Delete
            </button>
          </form>
        )}
      </div>
    </form>
  );
};

export default ParentForm;
