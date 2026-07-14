export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className={`text-2xl font-extrabold tracking-tight ${light ? "text-white" : "text-emit-navy dark:text-slate-100"}`}>
        <span className="text-emit-sky drop-shadow-[0_0_6px_rgba(126,200,227,0.6)] dark:drop-shadow-[0_0_8px_rgba(126,200,227,0.8)]">E</span>MIT
      </span>
      <span className={`text-[9px] font-semibold uppercase tracking-wider ${light ? "text-emit-light" : "text-slate-500 dark:text-slate-400"}`}>
        Ecole de Management et d'Innovation Technologique
      </span>
    </div>
  );
}
