import { useEffect, useState } from "react";
import { useRef } from "react";
import { apiNiveaux, apiSemestres, apiEdt, apiDownloadPdf } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarDays,
  Search,
  Clock,
} from "lucide-react";
import Logo from "@/components/Logo";
import WeeklyGrid from "@/components/WeeklyGrid";
import type { SlotEDT, CoursType, Niveau, Semestre } from "@/types";

// ─── Couleurs par type ────────────────────────────────────────────
const TYPE_CONFIG: Record<CoursType, { label: string; bg: string; dot: string; text: string }> = {
  CM: { label: "Cours Magistral", bg: "bg-emit-navy/10", dot: "bg-emit-navy", text: "text-emit-navy" },
  TD: { label: "Travaux Dirigés", bg: "bg-sky-100", dot: "bg-sky-400", text: "text-sky-700" },
  TP: { label: "Travaux Pratiques", bg: "bg-emerald-100", dot: "bg-emerald-400", text: "text-emerald-700" },
};

// ─── Badge niveau ─────────────────────────────────────────────────
const NIVEAU_COLORS: Record<string, string> = {
  L1: "from-emit-navy to-blue-700",
  L2: "from-emit-navy to-blue-700",
  L3: "from-emit-navy to-blue-700",
  M1: "from-emit-navy to-blue-700",
  M2: "from-emit-navy to-blue-700",
};

export default function PublicEdt() {
  // ─── Données réelles ──────────────────────────────────────────
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [semestre, setSemestre] = useState<Semestre | null>(null);
  const [allEdtSlots, setAllEdtSlots] = useState<SlotEDT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── State UI ─────────────────────────────────────────────────
  const [activeNiveau, setActiveNiveau] = useState("");
  const [activeFiliere, setActiveFiliere] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CoursType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [overviewIndex, setOverviewIndex] = useState(0);

  const niveauScrollRef = useRef<HTMLDivElement>(null);
  const overviewScrollRef = useRef<HTMLDivElement>(null);
  const plannerRef = useRef<HTMLDivElement>(null);

  // ─── Chargement initial ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [niveauxData, semestresData] = await Promise.all([
          apiNiveaux(),
          apiSemestres(),
        ]);
        setNiveaux(niveauxData);

        const publie = semestresData.find((s) => s.statut === "publie") ?? null;
        setSemestre(publie);

        if (publie) {
          const slots = await apiEdt({ semestreId: publie.id });
          setAllEdtSlots(slots);
        }

        if (niveauxData.length > 0) {
          setActiveNiveau(niveauxData[0].libelle);
          if (niveauxData[0].filieres.length > 0) {
            setActiveFiliere(niveauxData[0].filieres[0].libelle);
          }
        }
      } catch (e: any) {
        setError(e.message ?? "Impossible de charger l'emploi du temps.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Données dérivées ─────────────────────────────────────────
  const currentNiveau = niveaux.find((n) => n.libelle === activeNiveau);
  const filieres = currentNiveau?.filieres ?? [];

  // Quand le niveau change, sélectionner la première filière disponible
  const handleNiveauChange = (niv: string) => {
    setActiveNiveau(niv);
    const nObj = niveaux.find((n) => n.libelle === niv);
    if (nObj && nObj.filieres.length > 0) {
      setActiveFiliere(nObj.filieres[0].libelle);
    }
  };

  // Slots filtrés pour la grille active
  let slots: SlotEDT[] = allEdtSlots.filter(
    (s) => s.niveau === activeNiveau && s.filiere === activeFiliere
  );
  if (typeFilter !== "ALL") slots = slots.filter((s) => s.type === typeFilter);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    slots = slots.filter(
      (s) =>
        s.intitule.toLowerCase().includes(q) ||
        s.enseignant.toLowerCase().includes(q) ||
        s.salle.toLowerCase().includes(q)
    );
  }

  // Grille complète pour scroll horizontal : toutes combinaisons niveau/filière
  const allCombinations = niveaux.flatMap((n) =>
    n.filieres.map((f) => ({ niveau: n.libelle, filiere: f.libelle }))
  );
  const totalCards = allCombinations.length;

  // Navigation boutons vue d'ensemble
  const scrollToCard = (index: number) => {
    const next = Math.max(0, Math.min(index, totalCards - 1));
    setOverviewIndex(next);
    const container = overviewScrollRef.current;
    if (!container) return;
    const card = container.children[next] as HTMLElement | undefined;
    if (card) {
      container.scrollTo({ left: card.offsetLeft - container.offsetLeft, behavior: "smooth" });
    }
  };

  const scrollToPlanner = () => {
    plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── États de chargement / erreur / absence de publication ───
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emit-navy">
        <p className="text-sm text-white/70">Chargement de l'emploi du temps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emit-navy px-4">
        <p className="max-w-md text-center text-sm text-white/80">{error}</p>
      </div>
    );
  }

  if (!semestre) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-emit-navy px-4 text-center">
        <CalendarDays className="h-10 w-10 text-white/40" />
        <p className="text-base font-semibold text-white">Aucun emploi du temps publié pour le moment.</p>
        <p className="max-w-md text-sm text-white/60">
          Revenez plus tard, il sera affiché ici dès sa publication par l'administration.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emit-navy">

      {/* ══════════════════════════════════════════════════════
          HEADER HERO GLASSMORPHISM
      ══════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden bg-[linear-gradient(135deg,#081234_0%,#0D1B4B_48%,#1e40af_100%)]">
        {/* Cercles décoratifs */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/20" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(126,200,227,0.24),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-5 md:pb-10">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Logo light />
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm sm:inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Accès public
              </span>
              <button
                disabled
                title="Export PDF bientôt disponible"
                className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white/50 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Télécharger PDF</span>
              </button>
            </div>
          </div>

          {/* Titre + infos */}
          <div className="mt-8 grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-emit-sky/80 text-sm font-medium mb-2">
              <CalendarDays className="h-4 w-4" />
              Emploi du temps — {semestre.libelle} — {semestre.annee}
            </div>
            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              Emploi du temps {activeNiveau} {activeFiliere}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Consultez les emplois du temps par niveau et filière
            </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <button
                onClick={scrollToPlanner}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-emit-navy shadow-xl shadow-black/20 transition hover:bg-emit-light focus:outline-none focus:ring-2 focus:ring-emit-sky focus:ring-offset-2 focus:ring-offset-emit-navy"
              >
                <CalendarDays className="h-5 w-5" />
                Voir mon EDT
              </button>
              <div className="grid grid-cols-2 gap-2 text-white sm:min-w-64">
                <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase text-white/50">Creneaux</p>
                  <p className="text-lg font-extrabold">{slots.length}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase text-white/50">Filieres</p>
                  <p className="text-lg font-extrabold">{filieres.length}</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          ONGLETS NIVEAUX — SCROLL HORIZONTAL
      ══════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-emit-navy/90 shadow-lg shadow-black/10 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4">
          <div
            ref={niveauScrollRef}
            className="flex gap-1 overflow-x-auto py-3"
            style={{ scrollbarWidth: "none" }}
          >
            {niveaux.map((n) => {
              const isActive = n.libelle === activeNiveau;
              const gradient = NIVEAU_COLORS[n.libelle] ?? "from-slate-500 to-slate-600";
              return (
                <button
                  key={n.id}
                  onClick={() => handleNiveauChange(n.libelle)}
                  className={`
                    relative flex shrink-0 flex-col items-center rounded-lg px-5 py-2.5 text-sm font-semibold
                    transition-all duration-200
                    ${isActive
                      ? `bg-gradient-to-br ${gradient} text-white shadow-lg shadow-black/30 ring-1 ring-emit-sky/40`
                      : "text-white/55 hover:text-white hover:bg-emit-sky/15"
                    }
                  `}
                >
                  <span className="text-base font-extrabold">{n.libelle}</span>
                  <span className="text-[10px] font-normal opacity-70">
                    {n.filieres.length} filière{n.filieres.length > 1 ? "s" : ""}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-emit-sky" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENU PRINCIPAL — FOND CLAIR
      ══════════════════════════════════════════════════════ */}
      <div ref={plannerRef} className="min-h-screen bg-slate-50 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-5">

          {/* ── Filières groupées par domaine ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            {/* En-tête avec filtres */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filières disponibles</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cours, enseignant, salle…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20"
                  />
                </div>
                {(["ALL", "CM", "TD", "TP"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`h-9 rounded-lg px-3 text-xs font-semibold border transition-all ${typeFilter === t
                      ? "bg-emit-navy text-white border-emit-navy"
                      : "bg-white text-slate-500 border-slate-200 hover:border-emit-sky hover:text-emit-navy"
                      }`}
                  >
                    {t === "ALL" ? "Tous" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Filières groupées par domaine */}
            {(() => {
              // Grouper par domaine
              const groups: Record<string, typeof filieres> = {};
              filieres.forEach((f) => {
                const key = f.domaine ?? "Autres";
                if (!groups[key]) groups[key] = [];
                groups[key].push(f);
              });
              return Object.entries(groups).map(([domaine, filsGroup]) => (
                <div key={domaine}>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{domaine}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filsGroup.map((f) => {
                      const isActive = f.libelle === activeFiliere;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setActiveFiliere(f.libelle)}
                          title={f.description}
                          className={`group flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${isActive
                            ? "border-emit-navy bg-emit-navy text-white shadow-sm ring-2 ring-emit-sky/20"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emit-sky hover:bg-emit-light/60 hover:text-emit-navy"
                            }`}
                        >
                          <span className="font-bold">{f.libelle}</span>
                          <span className={`hidden sm:inline max-w-[180px] truncate font-normal ${isActive ? "opacity-70" : "text-slate-400"
                            }`}>
                            {f.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* ── Infos semestre + légende ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <div>
              <div className="text-sm font-bold text-emit-navy">{semestre.libelle}</div>
              <div className="text-xs text-slate-400">{semestre.annee}</div>
            </div>

            {/* Légende */}
            <div className="flex items-center gap-4">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <span key={type} className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              ))}
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {slots.length} créneau{slots.length > 1 ? "x" : ""}
              </span>
            </div>
          </div>

          {/* ── Titre de section ── */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${NIVEAU_COLORS[activeNiveau] ?? "from-slate-500 to-slate-600"} text-white font-extrabold text-sm shadow`}
            >
              {activeNiveau}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeNiveau} — Filière {activeFiliere}
              </h2>
              <p className="text-xs text-slate-500">
                {currentNiveau?.filieres.find((f) => f.libelle === activeFiliere)?.description}
              </p>
            </div>
          </div>

          {/* ── Grille EDT principale ── */}
          {slots.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700">
                Aucun créneau pour {activeNiveau} — {activeFiliere}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {searchQuery
                  ? "Aucun résultat pour votre recherche."
                  : "L'emploi du temps sera affiché ici dès sa publication."}
              </p>
            </div>
          ) : (
            <WeeklyGrid slots={slots} highlightToday />
          )}

          {/* SECTION : TOUS LES EDT — NAVIGATION PAR BOUTONS  */}
           
          <div className="mt-8">
            {/* En-tête avec boutons de navigation */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Vue d'ensemble — Tous les niveaux</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {overviewIndex + 1} / {totalCards} — {allCombinations[overviewIndex]?.niveau} {allCombinations[overviewIndex]?.filiere}
                </p>
              </div>
              {/* Boutons navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollToCard(overviewIndex - 1)}
                  disabled={overviewIndex === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emit-navy hover:text-emit-navy disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Indicateurs points */}
                <div className="flex items-center gap-1.5">
                  {allCombinations.map((c, i) => (
                    <button
                      key={`${c.niveau}-${c.filiere}`}
                      onClick={() => scrollToCard(i)}
                      className={`rounded-full transition-all duration-200 ${i === overviewIndex
                        ? "h-2.5 w-6 bg-emit-navy"
                        : "h-2 w-2 bg-slate-300 hover:bg-slate-400"
                        }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => scrollToCard(overviewIndex + 1)}
                  disabled={overviewIndex === totalCards - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emit-navy hover:text-emit-navy disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Conteneur scroll (sans scrollbar visible, contrôlé par boutons) */}
            <div
              ref={overviewScrollRef}
              className="flex gap-5 overflow-x-auto pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollSnapType: "x mandatory" }}
            >
              {allCombinations.map(({ niveau, filiere }, cardIdx) => {
                const nSlots = allEdtSlots.filter(
                  (s) => s.niveau === niveau && s.filiere === filiere
                );
                const isActive = niveau === activeNiveau && filiere === activeFiliere;
                const isCurrent = cardIdx === overviewIndex;
                const gradient = NIVEAU_COLORS[niveau] ?? "from-slate-500 to-slate-600";

                return (
                  <div
                    key={`${niveau}-${filiere}`}
                    className={`shrink-0 rounded-2xl border-2 bg-white overflow-hidden transition-all duration-300 ${isActive
                      ? "border-emit-navy shadow-xl shadow-emit-navy/20"
                      : isCurrent
                        ? "border-slate-400 shadow-md"
                        : "border-slate-200 opacity-60"
                      }`}
                    style={{ width: 820, scrollSnapAlign: "start" }}
                  >
                    {/* En-tête de la card */}
                    <div className={`flex items-center justify-between bg-gradient-to-r ${gradient} px-5 py-3`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-white">{niveau}</span>
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                          {filiere}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                            ● Actif
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60">{cardIdx + 1}/{totalCards}</span>
                        <button
                          onClick={() => { setActiveNiveau(niveau); setActiveFiliere(filiere); }}
                          className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition"
                        >
                          Sélectionner
                        </button>
                      </div>
                    </div>

                    {/* Grille */}
                    <div className="p-1">
                      {nSlots.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-slate-400">
                          Aucun EDT publié
                        </div>
                      ) : (
                        <WeeklyGrid slots={nSlots} highlightToday={isActive} />
                      )}
                    </div>

                    {/* Footer stats */}
                    <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-2.5 bg-slate-50/50">
                      {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                        const count = nSlots.filter((s) => s.type === type).length;
                        return (
                          <span key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                            <span className="font-semibold text-slate-700">{count}</span> {type}
                          </span>
                        );
                      })}
                      <span className="ml-auto text-xs text-slate-400">{nSlots.length} créneaux total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pied de page info */}
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 flex items-center justify-between text-xs text-slate-500">
            <p>
              Dernière publication :{" "}
              <strong className="text-slate-700">
                {semestre.datePublication
                  ? new Date(semestre.datePublication).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </strong>{" "}
              · {semestre.libelle} — {semestre.annee}
            </p>
            <p className="hidden sm:block">Toute modification sera visible ici automatiquement.</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        © 2025 EMIT — École de Management et d'Innovation Technologique
      </footer>
    </div>
  );
}