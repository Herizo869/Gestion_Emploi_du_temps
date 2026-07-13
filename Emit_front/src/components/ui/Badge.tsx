import type { ReactNode } from "react";

type Tone = "default" | "blue" | "navy" | "green" | "orange" | "red" | "gray" | "purple" | "sky";

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

export default function Badge({ tone = "default", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
