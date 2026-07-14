import type { ReactNode } from "react";
import { Card, CardBody } from "./ui/Card";

const iconBg: Record<string, string> = {
  red: "from-red-50 to-red-100 text-red-600 dark:from-red-900/30 dark:to-red-900/20 dark:text-red-400",
  green: "from-green-50 to-green-100 text-green-600 dark:from-green-900/30 dark:to-green-900/20 dark:text-green-400",
  blue: "from-blue-50 to-blue-100 text-emit-blue dark:from-blue-900/30 dark:to-blue-900/20 dark:text-blue-400",
  default: "from-slate-50 to-slate-100 text-emit-navy dark:from-slate-700 dark:to-slate-600 dark:text-emit-sky",
};

export default function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  tone?: "default" | "red" | "green" | "blue";
  onClick?: () => void;
}) {
  const toneCls =
    tone === "red"
      ? "text-red-600"
      : tone === "green"
        ? "text-green-600"
        : tone === "blue"
          ? "text-emit-blue dark:text-blue-400"
          : "text-slate-800 dark:text-slate-100";
  return (
    <div
      onClick={onClick}
      className={`group ${onClick ? "cursor-pointer" : ""} transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      <Card>
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-emit-navy dark:group-hover:text-emit-sky transition-colors">
              {label}
            </p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${toneCls} group-hover:scale-105 transition-transform origin-left`}>
              {value}
            </p>
            {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
          </div>
          {icon && (
            <div
              className={`grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${iconBg[tone]}`}
            >
              {icon}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
