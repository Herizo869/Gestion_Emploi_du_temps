import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Info } from "lucide-react";
import Logo from "@/components/Logo";
import WeeklyGrid from "@/components/WeeklyGrid";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { edtL3Info, niveaux } from "@/data/mock";
import type { SlotEDT, CoursType } from "@/types";

export default function PublicEdt() {
  const [params, setParams] = useSearchParams();
  const niveau = params.get("niveau") || "L3";
  const filiere = params.get("filiere") || "INFO";
  const type = (params.get("type") || "ALL") as "ALL" | CoursType;
  const semaine = params.get("semaine") || "19";

  const [week, setWeek] = useState(parseInt(semaine, 10));

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    next.set(k, v);
    setParams(next);
  };

  let slots: SlotEDT[] = edtL3Info;
  if (type !== "ALL") slots = slots.filter(s => s.type === type);
  if (niveau !== "L3" || filiere !== "INFO") slots = [];

  const niveauObj = niveaux.find(n => n.libelle === niveau);
  const filieres = niveauObj?.filieres.map(f => f.libelle) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar publique */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden text-sm text-slate-400 sm:inline">— Emploi du temps</span>
          </div>
          <Badge tone="sky">Accès public</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900">Emploi du temps EMIT</h1>

        {/* Filtres */}
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Niveau</label>
            <select value={niveau} onChange={(e) => update("niveau", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              {niveaux.map(n => <option key={n.id}>{n.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Filière</label>
            <select value={filiere} onChange={(e) => update("filiere", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              {filieres.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Type de cours</label>
            <select value={type} onChange={(e) => update("type", e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="ALL">Tous</option>
              <option value="CM">CM seulement</option>
              <option value="TD">TD seulement</option>
              <option value="TP">TP seulement</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button fullWidth leftIcon={<Download className="h-4 w-4" />}>Télécharger PDF</Button>
          </div>
        </div>

        {/* Navigation semaine */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeek(w => w - 1)} className="rounded p-1.5 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium">Semaine {week} · Semestre 1 — 2024-2025</span>
            <button onClick={() => setWeek(w => w + 1)} className="rounded p-1.5 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emit-navy" />CM</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-300" />TD</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-300" />TP</span>
          </div>
        </div>

        {/* Grille ou message vide */}
        {slots.length === 0 ? (
          <div className="rounded-xl border border-emit-sky/30 bg-emit-light/40 p-8 text-center">
            <Info className="mx-auto h-8 w-8 text-emit-navy" />
            <p className="mt-3 text-sm font-medium text-emit-navy">
              Aucun EDT publié pour {niveau} {filiere}.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              L'emploi du temps sera affiché ici dès sa publication par l'administration.
            </p>
          </div>
        ) : (
          <WeeklyGrid slots={slots} highlightToday />
        )}

        {/* Barre d'information */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <p>
            Dernière publication : <strong className="text-slate-700">15 mai 2025</strong> · Semestre 1 — 2024-2025
          </p>
          <p className="mt-1">Toute modification sera visible ici automatiquement.</p>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        © EMIT — École de Management et d'Innovation Technologique
      </footer>
    </div>
  );
}
