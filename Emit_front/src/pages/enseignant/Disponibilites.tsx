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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Mes disponibilités</h1>
        <div className="flex items-center gap-3">
          <select value={semestreId} onChange={(e) => setSemestreId(e.target.value)}
            className="h-10 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20">
            {semestres.map(s => (
              <option key={s.id} value={s.id}>{s.libelle} — {s.annee}</option>
            ))}
          </select>
          <select value={coursId} onChange={(e) => setCoursId(e.target.value)}
            className="h-10 min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20">
            {mesCours.map(c => (
              <option key={c.id} value={c.id}>{c.intitule} — {c.niveauLibelle}</option>
            ))}
          </select>
          <Button
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            onClick={handleSave}
            disabled={saving || loading || !semestreId || !coursId}
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {coursActuel && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <BookOpen className="h-4 w-4 text-emit-sky" />
          <span>Grille pour <strong>{coursActuel.intitule}</strong></span>
          <Badge tone="blue">{coursActuel.niveauLibelle}</Badge>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> ✓ Disponibilités enregistrées avec succès
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {conflits.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Conflit entre deux de vos cours
          </div>
          {conflits.map((c, i) => (
            <p key={i} className="pl-6 text-xs">
              {c.jour} {c.creneau} : <strong>{c.cours1}</strong> et <strong>{c.cours2}</strong> se chevauchent — vous êtes déclaré(e) disponible pour les deux en même temps.
            </p>
          ))}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-slate-700">Légende :</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-green-500 shadow-sm" />Disponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-red-500 shadow-sm" />Indisponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-slate-200 border border-slate-300" />Non renseigné</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">Cliquez sur une case pour basculer</span>
            {changed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse ml-2">
                <AlertTriangle className="h-3 w-3" /> Non sauvegardé
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emit-sky" />
                <p className="text-sm text-slate-500">Chargement de vos disponibilités...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-100 px-3 py-3 text-left text-xs font-semibold text-slate-600 border-r border-slate-200">
                      <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Créneaux</div>
                    </th>
                    {JOURS.map((jour, idx) => (
                      <th key={jour} className={`px-3 py-3 text-center text-xs font-semibold border-b-2 ${idx === new Date().getDay() - 1 ? "bg-emit-light/60 text-emit-navy border-b-emit-sky" : "bg-slate-50 text-slate-600 border-b-slate-200"}`}>
                        {jour}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRENEAUX.map((c, r) => (
                    <tr key={c} className="group">
                      <td className="sticky left-0 z-10 bg-slate-50/90 px-3 py-2.5 text-xs font-mono text-slate-600 border-r border-slate-200 font-medium">{c}</td>
                      {JOURS.map((j, ci) => {
                        const v = grid[r][ci];
                        const isDispo = v === "dispo";
                        const isIndispo = v === "indispo";
                        return (
                          <td key={j} className="border border-slate-100 p-1">
                            <button onClick={() => toggle(r, ci)}
                              className={`relative h-10 w-full rounded-lg border-2 transition-all duration-150 ${
                                isDispo ? "bg-green-100 border-green-400 hover:bg-green-200 hover:border-green-500"
                                : isIndispo ? "bg-red-100 border-red-400 hover:bg-red-200 hover:border-red-500"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                              title={`${j} ${c}: ${isDispo ? "Disponible" : isIndispo ? "Indisponible" : "Non renseigné"}`}>
                              {isDispo && <span className="absolute inset-0 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-green-600" /></span>}
                              {isIndispo && <span className="absolute inset-0 flex items-center justify-center"><XCircle className="h-4 w-4 text-red-600" /></span>}
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

          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Une indisponibilité créant un conflit avec un cours planifié sera signalée à l'admin.
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Total cette semaine : <strong className="text-emit-navy text-lg">{totalHours}h</strong>
            </p>
            {changed && (
              <span className="text-xs text-amber-600 font-medium">Modifications non enregistrées</span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}