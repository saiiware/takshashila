import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export default function TextField({ label, id, className = "", ...rest }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        className={`rounded-card border border-line bg-white px-4 py-3 text-lg text-ink
          placeholder:text-ink/40 focus:border-workshop-500 ${className}`}
        {...rest}
      />
    </div>
  );
}
