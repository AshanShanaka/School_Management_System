import { UseFormRegister } from "react-hook-form";

interface SelectFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: any;
  options: { value: string | number; label: string }[];
}

const SelectField = ({
  label,
  name,
  register,
  error,
  options,
}: SelectFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
        {...register(name)}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error?.message && (
        <p className="text-sm text-red-500">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default SelectField;
