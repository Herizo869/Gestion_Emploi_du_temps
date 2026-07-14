import type { InputHTMLAttributes, ReactNode } from "react";

export default function Input({
  label,
  leftIcon,
  rightIcon,
  error,
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          {...props}
          className={`h-11 w-full rounded-lg border bg-white text-sm outline-none transition focus:border-emit-blue focus:ring-2 focus:ring-emit-blue/20 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 ${
            leftIcon ? "pl-10" : "pl-3"
          } ${rightIcon ? "pr-10" : "pr-3"} ${
            error ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600"
          } ${className}`}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
