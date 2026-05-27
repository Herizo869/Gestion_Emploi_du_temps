export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className={`text-2xl font-extrabold tracking-tight ${light ? "text-white" : "text-emit-navy"}`}>
        <span className="text-emit-sky">E</span>MIT
      </span>
      <span className={`text-[9px] font-semibold uppercase tracking-wider ${light ? "text-emit-light" : "text-slate-500"}`}>
        Ecole de Management et d'Innovation Technologique
      </span>
    </div>
  );
}
