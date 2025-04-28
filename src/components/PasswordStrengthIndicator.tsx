"use client";

type PasswordStrengthProps = {
  password: string;
};

const PasswordStrengthIndicator = ({ password }: PasswordStrengthProps) => {
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", tips: "" };

    let criteriaCount = 0;
    let tips = [];

    // Has uppercase
    if (!/[A-Z]/.test(password)) tips.push("uppercase letter");
    else criteriaCount++;

    // Has lowercase
    if (!/[a-z]/.test(password)) tips.push("lowercase letter");
    else criteriaCount++;

    // Has number
    if (!/\d/.test(password)) tips.push("number");
    else criteriaCount++;

    // Has special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      tips.push("special character");
    else criteriaCount++;

    // Length check
    if (password.length < 8) tips.push("at least 8 characters");

    const tipString =
      tips.length > 0
        ? `Add: ${tips.join(", ")}`
        : "Password meets basic requirements";

    // Determine strength
    if (criteriaCount >= 3 && password.length >= 8) {
      return { strength: 3, label: "Strong", tips: tipString };
    } else if (criteriaCount >= 2 && password.length >= 8) {
      return { strength: 2, label: "Medium", tips: tipString };
    } else {
      return { strength: 1, label: "Weak", tips: tipString };
    }
  };

  const { strength, label, tips } = getPasswordStrength(password);

  const getColor = () => {
    switch (strength) {
      case 3:
        return "bg-green-500";
      case 2:
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  if (!password) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 h-1">
        <div
          className={`w-10 h-full rounded ${
            strength >= 1 ? getColor() : "bg-gray-200"
          }`}
        ></div>
        <div
          className={`w-10 h-full rounded ${
            strength >= 2 ? getColor() : "bg-gray-200"
          }`}
        ></div>
        <div
          className={`w-10 h-full rounded ${
            strength >= 3 ? getColor() : "bg-gray-200"
          }`}
        ></div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">Strength: {label}</span>
        <span className="text-xs text-gray-400">{tips}</span>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
