import type { ReactNode } from "react";

type Tone = "default" | "blue" | "navy" | "green" | "orange" | "red" | "gray" | "purple" | "sky";

const tones: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  navy: "bg-emit-navy text-white",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-slate-200 text-slate-600",
  purple: "bg-purple-100 text-purple-700",
  sky: "bg-sky-100 text-sky-700",
};

export default function Badge({ tone = "default", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
