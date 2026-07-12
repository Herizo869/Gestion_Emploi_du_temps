import React, { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import type { UserRole } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthSplashProps {
  role: UserRole;
  userName?: string | null;
  onDone: () => void;
}

// ─── Skeleton shimmer block ───────────────────────────────────────────────────
function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-white/6 ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ─── Admin skeleton layout ────────────────────────────────────────────────────
function AdminSkeleton() {
  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col gap-3 border-r border-white/5 bg-white/3 p-4">
        <Skeleton className="h-8 w-32 mb-2" />
        {[72, 60, 80, 55, 70, 65, 60, 58].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4" style={{ width: `${w}px` }} />
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Main table / chart area */}
        <div className="rounded-xl border border-white/5 bg-white/3 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-white/3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4" style={{ width: `${120 + i * 20}px`, maxWidth: "100%" }} />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>

        {/* Bottom 2-col */}
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" style={{ width: `${80 - j * 10}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Enseignant skeleton layout ───────────────────────────────────────────────
function EnseignantSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Top nav */}
      <header className="flex items-center justify-between border-b border-white/5 bg-white/3 px-6 py-3">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </header>

      <main className="flex-1 overflow-hidden p-6 space-y-6">
        {/* Welcome banner */}
        <div className="rounded-xl border border-white/5 bg-white/3 p-5 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        {/* Weekly grid skeleton */}
        <div className="rounded-xl border border-white/5 bg-white/3 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-5 gap-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven"].map(d => (
              <Skeleton key={d} className="h-6 w-full rounded-md" />
            ))}
          </div>
          {/* Slots */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className={`rounded-lg border border-white/5 p-2 space-y-1 ${
                  (i === 0 && j === 1) || (i === 2 && j === 3) ? "bg-emit-sky/10 border-emit-sky/15" :
                  (i === 1 && j === 2) ? "bg-green-500/10 border-green-500/15" : "bg-white/2"
                }`}>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-4 space-y-3">
              <div className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ durationMs }: { durationMs: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Interpolation smooth de 0 → 100 sur durationMs
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / durationMs) * 100, 100);
      setWidth(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
      <div
        className="h-full bg-gradient-to-r from-emit-sky via-indigo-400 to-violet-400 transition-none"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ─── Main AuthSplash ──────────────────────────────────────────────────────────
const DURATION_MS = 4000;

export default function AuthSplash({ role, userName, onDone }: AuthSplashProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    // Phase d'entrée (fade-in)
    const t1 = setTimeout(() => setPhase("show"), 50);
    // Phase de sortie (fade-out) 300ms avant la fin
    const t2 = setTimeout(() => setPhase("exit"), DURATION_MS - 300);
    // Appel du callback à la fin
    const t3 = setTimeout(() => onDone(), DURATION_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const greeting = userName
    ? `Bienvenue, ${userName.split(" ")[0]} !`
    : role === "admin"
    ? "Bienvenue, Administrateur !"
    : "Bienvenue sur votre espace !";

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-[#081234] transition-opacity duration-300 ${
        phase === "enter" ? "opacity-0" : phase === "show" ? "opacity-100" : "opacity-0"
      }`}
    >
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .splash-logo { animation: fadeSlideUp 0.5s ease-out both; }
        .splash-msg  { animation: fadeSlideUp 0.5s ease-out 0.15s both; }
        .splash-role { animation: fadeSlideUp 0.5s ease-out 0.25s both; }
      `}</style>

      {/* Top branding bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <div className="splash-logo">
          <Logo />
        </div>
        <div className="ml-2">
          <p className="splash-msg text-sm font-semibold text-white">{greeting}</p>
          <p className="splash-role text-[11px] text-emit-sky capitalize">
            {role === "admin" ? "🛡️ Espace Administrateur" : "📚 Espace Enseignant"}
          </p>
        </div>
      </div>

      {/* Skeleton body */}
      <div className="flex-1 overflow-hidden">
        {role === "admin" ? <AdminSkeleton /> : <EnseignantSkeleton />}
      </div>

      {/* Progress bar */}
      <ProgressBar durationMs={DURATION_MS} />
    </div>
  );
}
