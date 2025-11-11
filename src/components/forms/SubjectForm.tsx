"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, SubjectSchema } from "@/lib/formValidationSchemas";
import { createSubject, updateSubject } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const SubjectForm = ({
  type,
  data,
  setOpen,
  teachers,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  teachers: any[];
  onSuccess?: () => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createSubject : updateSubject,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Subject has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    }
  }, [state, router, type, setOpen, onSuccess]);

  // Ensure teachers is always an array
  const teachersList = Array.isArray(teachers) ? teachers : [];

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      {/* Header with Icon */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {type === "create" ? "Create New Subject" : "Update Subject"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {type === "create" ? "Add a new subject and assign teachers" : "Modify subject details and teachers"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Subject Name Field */}
        <div className="w-full">
          <InputField
            label="Subject name"
            name="name"
            defaultValue={data?.name}
            register={register}
            error={errors?.name}
          />
        </div>
        
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

        {/* Teachers Selection */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Assign Teachers
            </label>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {teachersList.length} available
            </span>
          </div>
          
          <select
            multiple
            size={8}
            className="ring-2 ring-gray-200 focus:ring-blue-500 focus:border-blue-500 p-3 rounded-lg text-sm w-full min-h-[220px] transition-all duration-200 bg-gray-50 hover:bg-white"
            {...register("teachers")}
            defaultValue={
              data?.teachers
                ? data.teachers.map((teacher: any) => 
                    typeof teacher === 'string' ? teacher : teacher.id
                  )
                : []
            }
          >
            {teachersList.length > 0 ? (
              teachersList.map(
                (teacher: { id: string; name: string; surname: string }) => (
                  <option 
                    value={teacher.id} 
                    key={teacher.id}
                    className="p-2 rounded cursor-pointer hover:bg-blue-50 my-0.5"
                  >
                    👤 {teacher.name} {teacher.surname}
                  </option>
                )
              )
            ) : (
              <option disabled className="text-gray-400">No teachers available</option>
            )}
          </select>
          
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Multi-select tip:</strong> Hold <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-800 font-mono text-xs">Ctrl</kbd> (Windows) or <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-blue-800 font-mono text-xs">⌘ Cmd</kbd> (Mac) while clicking to select multiple teachers
            </p>
          </div>
          
          {errors.teachers?.message && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-600 font-medium">
                {errors.teachers.message.toString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-700 font-medium">
            {state.message || "Something went wrong!"}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 hover:border-gray-400"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {type === "create" ? "✓ Create Subject" : "✓ Update Subject"}
        </button>
      </div>
    </form>
  );
};

export default SubjectForm;
