import type { ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  gradient = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  gradient?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-[fadeIn_.15s_ease-out] dark:bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-800 animate-[slideUp_.25s_ease-out]">
        <div
          className={`flex items-center justify-between px-5 py-3 ${
            gradient
              ? "bg-gradient-to-r from-emit-navy to-emit-navy-dark text-white rounded-t-xl"
              : "border-b border-slate-100 dark:border-slate-700"
          }`}
        >
          <h3 className={`text-base font-semibold ${gradient ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`rounded p-1 transition-colors ${
              gradient
                ? "text-white/70 hover:bg-white/10 hover:text-white"
                : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
