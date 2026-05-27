import { useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { enseignants, CRENEAUX, JOURS } from "@/data/mock";

type State = "dispo" | "indispo" | "vide";

export default function AdminDisponibilites() {
  const [eid, setEid] = useState(enseignants[0].id);
  const [grid, setGrid] = useState<State[][]>(
    () => CRENEAUX.map(() => JOURS.map(() => "vide"))
  );
  const [saved, setSaved] = useState(false);

  const toggle = (r: number, c: number) => {
    setGrid((g) => {
      const copy = g.map((row) => [...row]);
      const v = copy[r][c];
      copy[r][c] = v === "vide" ? "dispo" : v === "dispo" ? "indispo" : "vide";
      return copy;
    });
    setSaved(false);
  };

  const hoursDispo = grid.flat().filter((v) => v === "dispo").length * 1.5;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Disponibilités des enseignants</h1>
        <Button leftIcon={<Save className="h-4 w-4" />} onClick={() => setSaved(true)}>Sauvegarder</Button>
      </div>

      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          ✓ Disponibilités enregistrées
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Enseignant :</label>
            <select value={eid} onChange={(e) => setEid(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
              {enseignants.map((e) => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-500" />Disponible</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" />Indisponible</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200" />Non renseigné</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-slate-50 px-2 py-2 text-left text-xs text-slate-500">Créneau</th>
                  {JOURS.map((j) => (
                    <th key={j} className="border-l border-slate-200 bg-slate-50 px-2 py-2 text-left text-xs text-slate-700">{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRENEAUX.map((c, r) => (
                  <tr key={c}>
                    <td className="bg-slate-50/60 px-2 py-1 text-xs font-mono text-slate-600">{c}</td>
                    {JOURS.map((j, ci) => {
                      const v = grid[r][ci];
                      const bg = v === "dispo" ? "bg-green-500" : v === "indispo" ? "bg-red-500" : "bg-slate-200";
                      return (
                        <td key={j} className="border-l border-slate-100 p-1">
                          <button onClick={() => toggle(r, ci)} className={`h-8 w-full rounded ${bg} hover:opacity-80`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4" />
            Vérification automatique des conflits avec le planning actif.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Synthèse" subtitle="Heures disponibles déclarées" />
        <CardBody>
          <p className="text-sm text-slate-600">
            Total cette semaine : <strong>{hoursDispo}h</strong>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
