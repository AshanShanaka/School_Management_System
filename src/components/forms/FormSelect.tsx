import { UseFormRegister } from "react-hook-form";

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: { message?: string };
  options: Option[];
}

export default function FormSelect({
  label,
  name,
  register,
  error,
  options,
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-600">{label}</label>
      <select
        className="ring-1 ring-gray-300 p-2 rounded-md text-sm w-full focus:ring-2 focus:ring-lamaPurple focus:outline-none"
        {...register(name)}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error?.message && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  );
}
