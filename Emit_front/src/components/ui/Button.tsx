import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-emit-navy text-white hover:bg-emit-navy-dark dark:bg-emit-sky dark:text-slate-900 dark:hover:bg-emit-sky-dark dark:hover:text-white",
  secondary: "bg-emit-light text-emit-navy hover:bg-blue-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
  ghost: "bg-transparent text-emit-navy hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
  outline: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth,
  className = "",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;
  const glow =
    variant === "primary"
      ? "hover:shadow-[0_0_16px_rgba(126,200,227,0.35)] dark:hover:shadow-[0_0_20px_rgba(126,200,227,0.25)] transition-shadow duration-300"
      : "";
  const pulseGlow =
    variant === "primary" && !isDisabled
      ? "animate-[glow-pulse_3s_ease-in-out_infinite]"
      : "";

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${glow} ${variant === "primary" ? "active:scale-[0.97]" : ""} ${pulseGlow} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
