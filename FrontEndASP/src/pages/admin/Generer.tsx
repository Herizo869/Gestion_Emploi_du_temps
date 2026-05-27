import { useState } from "react";
import { Zap, CheckCircle2, RotateCw, Eye, Edit3 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { semestres } from "@/data/mock";

export default function AdminGenerer() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const launch = () => {
    setDone(false);
    setRunning(true);
    setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          setRunning(false);
          setDone(true);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Générer l'EDT automatiquement</h1>

      <Card>
        <CardHeader title="Configuration" />
        <CardBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Semestre cible</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:max-w-xs">
              {semestres.map((s) => <option key={s.id}>{s.libelle} ({s.annee})</option>)}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Cours à planifier", 67],
              ["Enseignants", 24],
              ["Salles disponibles", 17],
              ["Créneaux", 30],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">{l}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <Button leftIcon={<Zap className="h-4 w-4" />} disabled={running} onClick={launch}>
            {running ? "Génération en cours..." : "Lancer la génération"}
          </Button>

          {(running || done) && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Algorithme backtracking</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-emit-blue transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {done && (
        <Card>
          <CardHeader title="Résultat" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Génération réussie en 1.8s — 65 / 67 cours planifiés, 2 conflits résolus.
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Cours planifiés</p><p className="text-xl font-bold">65 / 67</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Conflits résolus</p><p className="text-xl font-bold">2</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Durée</p><p className="text-xl font-bold">1.8s</p></div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button leftIcon={<Eye className="h-4 w-4" />}>Voir le planning</Button>
              <Button variant="secondary" leftIcon={<Edit3 className="h-4 w-4" />}>Modifier manuellement</Button>
              <Button variant="outline" leftIcon={<RotateCw className="h-4 w-4" />}>Régénérer</Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Historique des générations" />
        <CardBody>
          <ul className="space-y-2 text-sm">
            {[
              { d: "2025-05-15 11:08", r: "Succès", n: 2 },
              { d: "2025-05-10 09:33", r: "Succès", n: 5 },
              { d: "2025-05-08 17:45", r: "Échec", n: 0 },
            ].map((x, i) => (
              <li key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <span className="text-slate-600 font-mono text-xs">{x.d}</span>
                <Badge tone={x.r === "Succès" ? "green" : "red"}>{x.r}</Badge>
                <span className="text-xs text-slate-500">{x.n} conflits</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
