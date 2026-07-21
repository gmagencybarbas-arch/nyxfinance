import { type HTMLAttributes, type ReactNode } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}

const sizeClasses = {
  sm: "max-w-2xl mx-auto",
  md: "max-w-4xl mx-auto",
  lg: "max-w-6xl mx-auto",
  full: "max-w-[1400px] mx-auto",
};

export function Container({
  children,
  size = "md",
  className = "",
  ...props
}: ContainerProps) {
  return (
    <div
      className={["w-full px-4 sm:px-6 lg:px-8", sizeClasses[size], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
