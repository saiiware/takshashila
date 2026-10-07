import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-card border border-line bg-white p-5 shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
