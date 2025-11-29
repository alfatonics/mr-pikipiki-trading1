import { forwardRef } from "react";
import { FiAlertCircle } from "react-icons/fi";

const ValidatedInput = forwardRef(
  (
    {
      label,
      name,
      value,
      onChange,
      error,
      errorMessage,
      required,
      type = "text",
      placeholder,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-500 ring-2 ring-red-200 bg-red-50 focus:ring-red-500"
              : "border-gray-300 focus:ring-primary-500"
          }`}
          placeholder={placeholder}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-sm text-red-600 flex items-center animate-pulse">
            <FiAlertCircle className="mr-1 flex-shrink-0" />
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

export default ValidatedInput;

