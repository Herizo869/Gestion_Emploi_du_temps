import type { ReactNode } from "react";
import { Card, CardBody } from "./ui/Card";

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
          ? "text-emit-blue"
          : "text-slate-800";
  return (
    <div
      onClick={onClick}
      className={`${onClick ? "cursor-pointer" : ""} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <Card>
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${toneCls}`}>{value}</p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
          </div>
          {icon && (
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-emit-light text-emit-navy">
              {icon}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
