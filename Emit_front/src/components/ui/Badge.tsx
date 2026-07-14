import type { ReactNode } from "react";

type Tone = "default" | "blue" | "navy" | "green" | "orange" | "red" | "gray" | "purple" | "sky";
type Variant = "filled" | "outline" | "dot";

const tones: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  navy: "bg-emit-navy text-white dark:bg-emit-sky dark:text-slate-900",
  green: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  gray: "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
};

const outlineTones: Record<Tone, string> = {
  default: "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300",
  blue: "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-300",
  navy: "border-emit-navy text-emit-navy dark:border-emit-sky dark:text-emit-sky",
  green: "border-green-300 text-green-600 dark:border-green-700 dark:text-green-300",
  orange: "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-300",
  red: "border-red-300 text-red-600 dark:border-red-700 dark:text-red-300",
  gray: "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400",
  purple: "border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-300",
  sky: "border-sky-300 text-sky-600 dark:border-sky-700 dark:text-sky-300",
};

const dotColors: Record<Tone, string> = {
  default: "bg-slate-400",
  blue: "bg-blue-500",
  navy: "bg-emit-navy dark:bg-emit-sky",
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  gray: "bg-slate-400",
  purple: "bg-purple-500",
  sky: "bg-sky-500",
};

export default function Badge({
  tone = "default",
  variant = "filled",
  children,
}: {
  tone?: Tone;
  variant?: Variant;
  children: ReactNode;
}) {
  if (variant === "dot") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
        <span className={`h-2 w-2 rounded-full ${dotColors[tone]}`} />
        {children}
      </span>
    );
  }

  if (variant === "outline") {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${outlineTones[tone]}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
