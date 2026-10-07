import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-workshop-500 text-white hover:bg-workshop-600 active:bg-workshop-700",
  secondary:
    "bg-turmeric-500 text-workshop-700 hover:bg-turmeric-600 active:bg-turmeric-600",
  ghost: "bg-transparent text-workshop-500 border border-workshop-500 hover:bg-workshop-50",
};

export default function Button({
  variant = "primary",
  children,
  fullWidth,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-card px-5 py-3 text-lg font-semibold
        transition-colors disabled:cursor-not-allowed disabled:opacity-50
        ${fullWidth ? "w-full" : ""} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
