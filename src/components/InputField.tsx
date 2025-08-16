import { FieldError } from "react-hook-form";

type Option = {
  value: string;
  label: string;
};

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>;
  hidden?: boolean;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  options?: Option[]; // ✅ Added to support <select>
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  onChange,
  placeholder,
  disabled,
  options,
}: InputFieldProps) => {
  if (hidden) return null;

  return (
    <div
      className={`flex flex-col gap-2 w-full md:w-1/4 ${
        hidden ? "hidden" : ""
      }`}
    >
      <label className="text-xs text-gray-500">{label}</label>

      {type === "select" && options ? (
        <select
          {...register(name)}
          defaultValue={defaultValue}
          onChange={(e) => {
            register(name).onChange(e);
            onChange?.(e);
          }}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md"
          disabled={disabled}
          {...inputProps}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          {...register(name)}
          defaultValue={defaultValue}
          onChange={(e) => {
            register(name).onChange(e);
            onChange?.(e);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md"
          {...inputProps}
        />
      )}

      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;
