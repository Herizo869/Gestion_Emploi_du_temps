import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, BookOpen } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { apiMyDispos, apiSaveMyDispos, apiCoursMine, type ConflitDispo } from "@/lib/api";
import { useData } from "@/context/DataContext";
import type { Cours } from "@/types";

const CRENEAUX = [
  "07h00 - 08h00", "08h00 - 09h00", "09h00 - 10h00", "10h00 - 11h00", "11h00 - 12h00",
  "14h00 - 15h00", "15h00 - 16h00", "16h00 - 17h00", "17h00 - 18h00",
] as const;
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;
const NB_CRENEAUX = CRENEAUX.length;
const NB_JOURS = JOURS.length;

type State = "dispo" | "indispo" | "vide";

export default function EnsDisponibilites() {
  const { semestres } = useData();
  const [mesCours, setMesCours] = useState<Cours[]>([]);
  const [semestreId, setSemestreId] = useState<string>("");
  const [coursId, setCoursId] = useState<string>("");
  const [grid, setGrid] = useState<State[][]>(
    () => Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State))
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState(false);
  const [conflits, setConflits] = useState<ConflitDispo[]>([]);

  useEffect(() => { apiCoursMine().then(setMesCours).catch(() => {}); }, []);

  useEffect(() => {
    if (semestres.length > 0 && !semestreId) {
      const publie = [...semestres].reverse().find(s => s.statut === "publie");
      setSemestreId((publie ?? semestres[semestres.length - 1]).id);
    }
  }, [semestres, semestreId]);

  useEffect(() => {
    if (mesCours.length > 0 && !coursId) setCoursId(mesCours[0].id);
  }, [mesCours, coursId]);

  useEffect(() => {
    if (!semestreId || !coursId) return;
    setLoading(true);
    apiMyDispos(semestreId, coursId)
      .then(dispos => {
        const newGrid = Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State));
        dispos.forEach(d => {
          const row = CRENEAUX.indexOf(d.creneau as typeof CRENEAUX[number]);
          const col = JOURS.indexOf(d.jour as typeof JOURS[number]);
          if (row >= 0 && col >= 0) {
            newGrid[row][col] = d.estDisponible ? "dispo" : "indispo";
          }
        });
        setGrid(newGrid);
        setChanged(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [semestreId, coursId]);

  const toggle = (r: number, c: number) => {
    setGrid(g => {
      const copy = g.map(row => [...row]);
      copy[r][c] = copy[r][c] === "vide" ? "dispo" : copy[r][c] === "dispo" ? "indispo" : "vide";
      return copy;
    });
    setChanged(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!semestreId) return setError("Veuillez sélectionner un semestre");
    if (!coursId) return setError("Veuillez sélectionner un cours");
    setSaving(true);
    setError(null);
    try {
      const disponibilites = [];
      for (let r = 0; r < NB_CRENEAUX; r++) {
        for (let c = 0; c < NB_JOURS; c++) {
          const state = grid[r][c];
          if (state !== "vide") {
            disponibilites.push({ jour: JOURS[c], creneau: CRENEAUX[r], estDisponible: state === "dispo", estIndisponible: state === "indispo" });
          }
        }
      }
      const res = await apiSaveMyDispos(semestreId, coursId, disponibilites as any);
      setConflits(res.conflits ?? []);
      setSaved(true);
      setChanged(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  const totalHours = grid.flat().filter(v => v === "dispo").length * 1;
  const coursActuel = mesCours.find(c => c.id === coursId);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ── Panneau de sélection avec glassmorphisme ── */}
      <div className="rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-md px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/60">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emit-navy to-emit-sky bg-clip-text text-transparent dark:from-emit-sky dark:to-blue-300">
            Mes disponibilités
          </h1>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <select value={semestreId} onChange={(e) => setSemestreId(e.target.value)}
                className="h-9 min-w-[170px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm appearance-none cursor-pointer focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                {semestres.map(s => (
                  <option key={s.id} value={s.id}>{s.libelle} — {s.annee}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select value={coursId} onChange={(e) => setCoursId(e.target.value)}
                className="h-9 min-w-[210px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm appearance-none cursor-pointer focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                {mesCours.map(c => (
                  <option key={c.id} value={c.id}>{c.intitule} — {c.niveauLibelle}</option>
                ))}
              </select>
            </div>
            <Button
              leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              onClick={handleSave}
              disabled={saving || loading || !semestreId || !coursId}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>

        {coursActuel && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-3">
            <span className="text-slate-400 dark:text-slate-500 text-xs">Grille pour</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emit-light/60 px-2.5 py-0.5 text-xs font-medium text-emit-navy dark:bg-emit-navy-dark/60 dark:text-emit-sky">
              <BookOpen className="h-3 w-3" /> {coursActuel.intitule}
            </span>
            <Badge tone="navy">{coursActuel.niveauLibelle}</Badge>
          </div>
        )}
      </div>

      {/* ── Alertes ── */}
      <div className="space-y-2">
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50/80 px-4 py-2.5 text-sm text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.1)] dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-green-900/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>✓ Disponibilités enregistrées avec succès</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50/80 px-4 py-2.5 text-sm text-red-700 dark:border-red-800/50 dark:from-red-900/20 dark:to-rose-900/10 dark:text-red-300">
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
        {conflits.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-3 text-sm text-amber-800 shadow-[0_0_12px_rgba(251,191,36,0.1)] dark:border-amber-500/30 dark:from-amber-900/20 dark:to-orange-900/10 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /> Conflit entre deux de vos cours
            </div>
            {conflits.map((c, i) => (
              <p key={i} className="pl-6 text-xs text-amber-700 dark:text-amber-300">
                {c.jour} {c.creneau} : <strong>{c.cours1}</strong> et <strong>{c.cours2}</strong> se chevauchent — vous êtes déclaré(e) disponible pour les deux en même temps.
              </p>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* ── Légende améliorée ── */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Légende :</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-b from-green-50 to-emerald-50/50 dark:from-green-900/15 dark:to-emerald-900/10">
              <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-green-400 to-green-500 shadow-sm" />Disponible
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-b from-red-50 to-rose-50/50 dark:from-red-900/15 dark:to-rose-900/10">
              <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-red-400 to-red-500 shadow-sm" />Indisponible
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-b from-slate-50 to-gray-50/50 dark:from-slate-800/50 dark:to-gray-800/30">
              <span className="h-3 w-3 rounded-sm bg-slate-200 border border-slate-300 dark:bg-slate-600 dark:border-slate-500" />Non renseigné
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-400 dark:text-slate-500 italic">Cliquez sur une case pour basculer</span>
            {changed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse ml-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> Non sauvegardé
              </span>
            )}
          </div>

          {/* ── Corps du tableau ── */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emit-sky" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Chargement de vos disponibilités...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-gradient-to-b from-emit-navy/90 to-emit-navy/70 px-3 py-3.5 text-left text-xs font-bold text-white/90 border-r border-white/10 tracking-wider uppercase dark:from-emit-navy-dark dark:to-slate-800/90 dark:border-slate-600">
                      <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Créneaux</div>
                    </th>
                    {JOURS.map((jour, idx) => {
                      const isToday = idx === new Date().getDay() - 1;
                      return (
                        <th key={jour} className={`px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                          isToday
                            ? "bg-gradient-to-b from-emit-sky/30 to-emit-light/40 text-emit-navy border-b-emit-sky dark:from-emit-sky/15 dark:to-emit-navy-dark/40 dark:text-emit-sky dark:border-b-emit-sky-dark"
                            : "bg-gradient-to-b from-slate-100/80 to-slate-50/60 text-slate-700 border-b-slate-200 dark:from-slate-700/60 dark:to-slate-800/40 dark:text-slate-300 dark:border-b-slate-600"
                        }`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{jour}</span>
                            {isToday && <span className="text-[10px] font-normal text-emit-sky-dark dark:text-emit-sky opacity-70">Aujourd'hui</span>}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CRENEAUX.map((c, r) => (
                    <tr key={c} className="group transition-colors duration-150 even:bg-slate-50/40 hover:bg-emit-sky/[0.03] dark:even:bg-slate-700/20 dark:hover:bg-emit-sky/[0.05]">
                      <td className="sticky left-0 z-10 bg-gradient-to-r from-slate-50/95 to-white/90 px-3 py-2.5 text-xs font-mono text-slate-600 border-r border-slate-200 font-semibold group-hover:from-emit-light/40 group-hover:to-white/60 dark:from-slate-800/95 dark:to-slate-800/90 dark:text-slate-300 dark:border-slate-600 dark:group-hover:from-emit-navy-dark/60 dark:group-hover:to-slate-800/80">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-emit-sky/40 group-hover:bg-emit-sky transition-colors" />
                          {c}
                        </span>
                      </td>
                      {JOURS.map((j, ci) => {
                        const v = grid[r][ci];
                        const isDispo = v === "dispo";
                        const isIndispo = v === "indispo";
                        return (
                          <td key={j} className="border border-slate-100 p-1 dark:border-slate-700/60">
                            <button onClick={() => toggle(r, ci)}
                              className={`relative h-10 w-full rounded-lg border-2 transition-all duration-200 active:scale-95 ${
                                isDispo
                                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-sm hover:from-green-100 hover:to-emerald-100 hover:border-green-500 hover:shadow-md"
                                  : isIndispo
                                  ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-400 shadow-sm hover:from-red-100 hover:to-rose-100 hover:border-red-500 hover:shadow-md"
                                  : "bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:from-slate-100 hover:to-slate-50 hover:border-slate-300 hover:shadow-sm dark:from-slate-700/40 dark:to-slate-800/30 dark:border-slate-600 dark:hover:from-slate-600/50 dark:hover:to-slate-700/40"
                              }`}
                              title={`${j} ${c}: ${isDispo ? "Disponible" : isIndispo ? "Indisponible" : "Non renseigné"}`}>
                              {isDispo && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
                                </span>
                              )}
                              {isIndispo && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <XCircle className="h-5 w-5 text-red-500 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Info ── */}
          <div className="flex items-center gap-2 rounded-xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50/60 px-3 py-2.5 text-sm text-orange-700 dark:border-orange-800/40 dark:from-orange-900/15 dark:to-amber-900/10 dark:text-orange-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
            Une indisponibilité créant un conflit avec un cours planifié sera signalée à l'admin.
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Total cette semaine :</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emit-navy to-emit-sky px-2.5 py-0.5 text-lg font-bold text-white shadow-sm dark:from-emit-navy-dark dark:to-emit-sky-dark">
                {totalHours}h
              </span>
            </div>
            {changed && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="h-3 w-3" /> Modifications non enregistrées
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}