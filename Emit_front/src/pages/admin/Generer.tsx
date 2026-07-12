import { useEffect, useState } from "react";
import { Zap, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";
import { apiGenererEdt, type GenerationEdtResult } from "@/lib/api";

export default function AdminGenerer() {
  const { semestres, cours, enseignants, salles } = useData();
  const [semestreId, setSemestreId] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationEdtResult | null>(null);

  // Sélectionne le premier semestre en brouillon par défaut
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
    try {
      const res = await apiGenererEdt(semestreId);
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la génération");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Générer l'EDT automatiquement</h1>

      <Card>
        <CardHeader title="Configuration" />
        <CardBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Semestre cible</label>
            <select
              value={semestreId}
              onChange={(e) => setSemestreId(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:max-w-xs"
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
              <div key={String(l)} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">{l}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button leftIcon={<Zap className="h-4 w-4" />} disabled={running || !semestreId} onClick={launch}>
            {running ? "Génération en cours..." : "Lancer la génération"}
          </Button>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader title="Résultat" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {result.slotsCrees} créneau{result.slotsCrees > 1 ? "x" : ""} créé{result.slotsCrees > 1 ? "s" : ""}
              {result.conflits.length > 0 && ` — ${result.conflits.length} conflit${result.conflits.length > 1 ? "s" : ""} détecté${result.conflits.length > 1 ? "s" : ""}`}
            </div>

            {result.coursNonPlanifies.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-orange-700">
                  <XCircle className="h-3.5 w-3.5" /> Cours non planifiés
                </p>
                <ul className="space-y-1 text-xs text-orange-700">
                  {result.coursNonPlanifies.map((c: string, i: number) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}

            {result.conflits.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> Conflits
                </p>
                <ul className="space-y-1 text-xs text-red-700">
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