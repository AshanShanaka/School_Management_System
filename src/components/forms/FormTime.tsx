import { UseFormRegister } from "react-hook-form";

interface FormTimeProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: { message?: string };
}

export default function FormTime({
  label,
  name,
  register,
  error,
}: FormTimeProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type="time"
        className="ring-1 ring-gray-300 p-2 rounded-md text-sm w-full focus:ring-2 focus:ring-lamaPurple focus:outline-none"
        {...register(name)}
      />
      {error?.message && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  );
}
