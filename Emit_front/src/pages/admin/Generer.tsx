import { useEffect, useRef, useState } from "react";
import { Zap, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";
import { apiGenererEdt, apiGenererEdtProgress, type GenerationEdtResult } from "@/lib/api";

const ETAPES = [
  "Nettoyage des anciens créneaux…",
  "Analyse des heures restantes…",
  "Chargement des disponibilités…",
  "Placement des cours…",
  "Sauvegarde des données…",
  "Recalcul de l'occupation…",
  "Détection des conflits…",
];

export default function AdminGenerer() {
  const { semestres, cours, enseignants, salles } = useData();
  const [semestreId, setSemestreId] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [etape, setEtape] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationEdtResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Nettoyer le polling au démontage
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Sélectionne le premier semestre par défaut
  useEffect(() => {
    if (!semestreId && semestres.length > 0) {
      setSemestreId(semestres[0].id);
    }
  }, [semestres, semestreId]);

  const launch = async () => {
    if (!semestreId) return setError("Sélectionne un semestre.");
    setRunning(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setEtape("Préparation…");

    // Polling de progression
    pollRef.current = setInterval(async () => {
      try {
        const p = await apiGenererEdtProgress(semestreId);
        setProgress(p.pourcentage);
        setEtape(p.etape);
        if (p.termine) {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Ignorer les erreurs de polling
      }
    }, 400);

    try {
      const res = await apiGenererEdt(semestreId);
      setProgress(100);
      setEtape("Génération terminée");
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la génération");
      setProgress(0);
      setEtape("");
    } finally {
      if (pollRef.current) clearInterval(pollRef.current);
      setRunning(false);
    }
  };

  const etapeIdx = ETAPES.findIndex(e => etape.includes(e.replace("…", "").split(" (")[0]));
  const etapeCourante = etapeIdx >= 0 ? etapeIdx + 1 : 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Générer l'EDT automatiquement</h1>

      <Card>
        <CardHeader title="Configuration" />
        <CardBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Semestre cible</label>
            <select
              value={semestreId}
              onChange={(e) => setSemestreId(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:max-w-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {semestres.length === 0 && <option value="">Aucun semestre</option>}
              {semestres.map((s) => (
                <option key={s.id} value={s.id}>{s.libelle} ({s.annee})</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Cours", cours.length],
              ["Enseignants", enseignants.length],
              ["Salles", salles.length],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{l}</p>
                <p className="mt-1 text-xl font-bold tabular-nums dark:text-slate-100">{v}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <Button leftIcon={running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} disabled={running || !semestreId} onClick={launch}>
            {running ? "Génération en cours…" : "Lancer la génération"}
          </Button>

          {/* Barre de progression */}
          {running && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-emit-navy dark:text-emit-sky">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {etape}
                </span>
                <span className="font-bold tabular-nums text-emit-navy dark:text-emit-sky">{progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emit-navy to-emit-sky transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Étapes */}
              <div className="flex justify-between pt-1">
                {ETAPES.map((e, i) => (
                  <div
                    key={e}
                    className="flex flex-col items-center gap-1"
                    style={{ width: `${100 / ETAPES.length}%` }}
                  >
                    <div
                      className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                        i <= etapeCourante ? "bg-emit-navy dark:text-emit-sky" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                    <span className={`text-[8px] text-center leading-tight ${
                      i <= etapeCourante ? "text-emit-navy dark:text-emit-sky font-medium" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {e.split("…")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader title="Résultat" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              {result.slotsCrees} créneau{result.slotsCrees > 1 ? "x" : ""} créé{result.slotsCrees > 1 ? "s" : ""}
              {result.conflits.length > 0 && ` — ${result.conflits.length} conflit${result.conflits.length > 1 ? "s" : ""} détecté${result.conflits.length > 1 ? "s" : ""}`}
            </div>

            {result.coursNonPlanifies.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300">
                  <XCircle className="h-3.5 w-3.5" /> Cours non planifiés
                </p>
                <ul className="space-y-1 text-xs text-orange-700 dark:text-orange-300">
                  {result.coursNonPlanifies.map((c: string, i: number) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}

            {result.conflits.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Conflits
                </p>
                <ul className="space-y-1 text-xs text-red-700 dark:text-red-300">
                  {result.conflits.map((c: any) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <Badge tone="red">{c.type}</Badge> {c.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}