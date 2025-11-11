"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  studentSchema,
  StudentSchema,
  parentSchema,
  ParentSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "@/hooks/useFormState";
import {
  createStudent,
  createParent,
  updateStudent,
  updateParent,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import PasswordStrengthIndicator from "../PasswordStrengthIndicator";

interface CombinedFormData {
  // Student fields
  student_email: string;
  student_password: string;
  student_first_name: string;
  student_last_name: string;
  student_phone?: string;
  student_birthday: string;
  student_class: string;
  student_grade: string;
  student_sex: "MALE" | "FEMALE";
  
  // Parent fields
  parent_email: string;
  parent_password: string;
  parent_first_name: string;
  parent_last_name: string;
  parent_phone: string;
  parent_birthday: string;
  parent_sex: "MALE" | "FEMALE";
  
  // Shared fields
  address: string;
}

const StudentParentForm = ({
  type,
  studentData,
  parentData,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  studentData?: any;
  parentData?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CombinedFormData>({
    defaultValues: {
      student_email: studentData?.email || "",
      student_first_name: studentData?.name || "",
      student_last_name: studentData?.surname || "",
      student_phone: studentData?.phone || "",
      student_birthday: studentData?.birthday?.toISOString().split("T")[0] || "",
      student_sex: studentData?.sex || "MALE",
      parent_email: parentData?.email || "",
      parent_first_name: parentData?.name || "",
      parent_last_name: parentData?.surname || "",
      parent_phone: parentData?.phone || "",
      parent_birthday: parentData?.birthday?.toISOString().split("T")[0] || "",
      parent_sex: parentData?.sex || "MALE",
      address: studentData?.address || parentData?.address || "",
    },
  });

  const [studentImg, setStudentImg] = useState<any>();
  const [parentImg, setParentImg] = useState<any>();
  const [studentPassword, setStudentPassword] = useState("");
  const [parentPassword, setParentPassword] = useState("");

  const router = useRouter();

  // Custom submission handler for combined data
  const onSubmit = async (data: CombinedFormData) => {
    try {
      toast(`Student and parent data prepared for ${type === "create" ? "creation" : "update"}!`);
      console.log("Combined form data:", data);
      
      // For now, just show success message
      // In production, you'd implement the actual API calls here
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  const { grades, classes } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Student & Parent" : "Update Student & Parent"}
      </h1>
      
      {/* Student Section */}
      <div className="border-l-4 border-blue-500 pl-4">
        <h2 className="text-lg font-medium text-blue-600 mb-4">Student Information</h2>
        
        <span className="text-xs text-gray-400 font-medium">Student Authentication</span>
        <div className="flex justify-between flex-wrap gap-4 mt-2 mb-6">
          <InputField
            label="Student Email"
            name="student_email"
            type="email"
            register={register}
            error={errors?.student_email}
          />
          <div className="flex flex-col gap-2 w-full md:w-[45%]">
            <InputField
              label="Student Password"
              name="student_password"
              type="password"
              register={register}
              error={errors?.student_password}
              onChange={(e) => setStudentPassword(e.target.value)}
            />
            <PasswordStrengthIndicator password={studentPassword} />
          </div>
        </div>

        <span className="text-xs text-gray-400 font-medium">Student Details</span>
        <CldUploadWidget
          uploadPreset="school"
          onSuccess={(result: any) => {
            setStudentImg(result.info);
          }}
        >
          {({ open }) => (
            <div
              className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer mt-2 mb-4"
              onClick={() => open?.()}
            >
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Upload student photo</span>
            </div>
          )}
        </CldUploadWidget>

        <div className="flex justify-between flex-wrap gap-4">
          <InputField
            label="Student First Name"
            name="student_first_name"
            register={register}
            error={errors.student_first_name}
          />
          <InputField
            label="Student Last Name"
            name="student_last_name"
            register={register}
            error={errors.student_last_name}
          />
          <InputField
            label="Student Phone"
            name="student_phone"
            register={register}
            error={errors.student_phone}
          />
          <InputField
            label="Student Birthday"
            name="student_birthday"
            type="date"
            register={register}
            error={errors.student_birthday}
          />
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Student Sex</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("student_sex")}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.student_sex?.message && (
              <p className="text-xs text-red-400">
                {errors.student_sex.message.toString()}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Student Grade</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("student_grade")}
            >
              <option value="">Select Grade</option>
              {grades.map((grade: { id: number; level: number }) => (
                <option value={grade.id} key={grade.id}>
                  {grade.level}
                </option>
              ))}
            </select>
            {errors.student_grade?.message && (
              <p className="text-xs text-red-400">
                {errors.student_grade.message.toString()}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Student Class</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("student_class")}
            >
              <option value="">Select Class</option>
              {classes.map(
                (classItem: {
                  id: number;
                  name: string;
                  capacity: number;
                  _count: { students: number };
                }) => (
                  <option value={classItem.id} key={classItem.id}>
                    {classItem.name} ({classItem._count.students}/{classItem.capacity})
                  </option>
                )
              )}
            </select>
            {errors.student_class?.message && (
              <p className="text-xs text-red-400">
                {errors.student_class.message.toString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Parent Section */}
      <div className="border-l-4 border-green-500 pl-4">
        <h2 className="text-lg font-medium text-green-600 mb-4">Parent Information</h2>
        
        <span className="text-xs text-gray-400 font-medium">Parent Authentication</span>
        <div className="flex justify-between flex-wrap gap-4 mt-2 mb-6">
          <InputField
            label="Parent Email"
            name="parent_email"
            type="email"
            register={register}
            error={errors?.parent_email}
          />
          <div className="flex flex-col gap-2 w-full md:w-[45%]">
            <InputField
              label="Parent Password"
              name="parent_password"
              type="password"
              register={register}
              error={errors?.parent_password}
              onChange={(e) => setParentPassword(e.target.value)}
            />
            <PasswordStrengthIndicator password={parentPassword} />
          </div>
        </div>

        <span className="text-xs text-gray-400 font-medium">Parent Details</span>
        <CldUploadWidget
          uploadPreset="school"
          onSuccess={(result: any) => {
            setParentImg(result.info);
          }}
        >
          {({ open }) => (
            <div
              className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer mt-2 mb-4"
              onClick={() => open?.()}
            >
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Upload parent photo</span>
            </div>
          )}
        </CldUploadWidget>

        <div className="flex justify-between flex-wrap gap-4">
          <InputField
            label="Parent First Name"
            name="parent_first_name"
            register={register}
            error={errors.parent_first_name}
          />
          <InputField
            label="Parent Last Name"
            name="parent_last_name"
            register={register}
            error={errors.parent_last_name}
          />
          <InputField
            label="Parent Phone"
            name="parent_phone"
            register={register}
            error={errors.parent_phone}
          />
          <InputField
            label="Parent Birthday"
            name="parent_birthday"
            type="date"
            register={register}
            error={errors.parent_birthday}
          />
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Parent Sex</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("parent_sex")}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.parent_sex?.message && (
              <p className="text-xs text-red-400">
                {errors.parent_sex.message.toString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Shared Information */}
      <div className="border-l-4 border-purple-500 pl-4">
        <h2 className="text-lg font-medium text-purple-600 mb-4">Shared Information</h2>
        <div className="flex justify-between flex-wrap gap-4">
          <InputField
            label="Address"
            name="address"
            register={register}
            error={errors.address}
          />
        </div>
      </div>

      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create Student & Parent" : "Update Student & Parent"}
      </button>
    </form>
  );
};

export default StudentParentForm;
