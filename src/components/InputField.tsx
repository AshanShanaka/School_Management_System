import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  hidden?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
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
}: InputFieldProps) => {
  return (
    <div
      className={`flex flex-col gap-2 w-full md:w-1/4 ${
        hidden ? "hidden" : ""
      }`}
    >
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md"
        {...register(name)}
        defaultValue={defaultValue}
        onChange={(e) => {
          register(name).onChange(e);
          onChange?.(e);
        }}
        placeholder={placeholder}
        disabled={disabled}
        {...inputProps}
      />
      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;
