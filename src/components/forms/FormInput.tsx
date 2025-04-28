import { UseFormRegister } from "react-hook-form";

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<any>;
  error?: { message?: string };
  hidden?: boolean;
}

export default function FormInput({
  label,
  name,
  type = "text",
  register,
  error,
  hidden = false,
}: FormInputProps) {
  return (
    <div className={`flex flex-col gap-2 ${hidden ? "hidden" : ""}`}>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type={type}
        className="ring-1 ring-gray-300 p-2 rounded-md text-sm w-full focus:ring-2 focus:ring-lamaPurple focus:outline-none"
        {...register(name)}
      />
      {error?.message && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  );
}
