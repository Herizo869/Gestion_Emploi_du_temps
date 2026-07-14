import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className = "",
  children,
  glass = false,
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { glass?: boolean; hover?: boolean }) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ${
        glass
          ? "glass glow-card"
          : "bg-white dark:border-slate-700 dark:bg-slate-800"
      } ${
        hover ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, gradient = false }: { title: string; subtitle?: string; action?: ReactNode; gradient?: boolean }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700 ${
        gradient
          ? "bg-gradient-to-r from-emit-navy to-emit-navy-dark text-white rounded-t-xl"
          : ""
      }`}
    >
      <div>
        <h3 className={`text-sm font-semibold ${gradient ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
          {title}
        </h3>
        {subtitle && (
          <p className={`mt-0.5 text-xs ${gradient ? "text-emit-sky/80" : "text-slate-500 dark:text-slate-400"}`}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
