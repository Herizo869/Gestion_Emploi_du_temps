import { useState, useEffect } from "react";
import { Save, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { apiMyDispos, apiSaveMyDispos } from "@/lib/api";

const CRENEAUX = [
  "07h30 - 09h00", "09h15 - 10h45", "11h00 - 12h30",
  "13h30 - 15h00", "15h15 - 16h45", "17h00 - 18h30",
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

type State = "dispo" | "indispo" | "vide";

export default function EnsDisponibilites() {
  const [grid, setGrid] = useState<State[][]>(
    () => CRENEAUX.map(() => JOURS.map(() => "vide"))
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les dispos existantes au montage
  useEffect(() => {
    apiMyDispos()
      .then(dispos => {
        const newGrid = CRENEAUX.map(() => JOURS.map(() => "vide" as State));
        dispos.forEach(d => {
          const row = CRENEAUX.indexOf(d.creneau);
          const col = JOURS.indexOf(d.jour as any);
          if (row >= 0 && col >= 0) {
            newGrid[row][col] = d.estDisponible ? "dispo" : "indispo";
          }
        });
        setGrid(newGrid);
      })
      .catch(() => {}); // pas d'endpoint encore — grille vide par défaut
  }, []);

  const toggle = (r: number, c: number) => {
    setGrid(g => {
      const copy = g.map(row => [...row]);
      const v = copy[r][c];
      copy[r][c] = v === "vide" ? "dispo" : v === "dispo" ? "indispo" : "vide";
      return copy;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const disponibilites = CRENEAUX.flatMap((creneau, r) =>
        JOURS.map((jour, c) => ({
          jour,
          creneau,
          estDisponible: grid[r][c] === "dispo",
          estIndisponible: grid[r][c] === "indispo",
        }))
      ).filter(d => d.estDisponible || d.estIndisponible);

      await apiSaveMyDispos(disponibilites as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const total = grid.flat().filter(v => v === "dispo").length * 1.5;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Mes disponibilités</h1>
        <Button
          leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          ✓ Disponibilités enregistrées avec succès
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-slate-700">Cliquez pour basculer :</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-500" />Disponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" />Indisponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200" />Non renseigné</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-slate-50 px-2 py-2 text-left text-xs text-slate-500">Créneau</th>
                  {JOURS.map(j => (
                    <th key={j} className="border-l border-slate-200 bg-slate-50 px-2 py-2 text-left text-xs text-slate-700">{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRENEAUX.map((c, r) => (
                  <tr key={c} className="border-b border-slate-100">
                    <td className="bg-slate-50/60 px-2 py-1 text-xs font-mono text-slate-600">{c}</td>
                    {JOURS.map((j, ci) => {
                      const v = grid[r][ci];
                      const bg = v === "dispo" ? "bg-green-500" : v === "indispo" ? "bg-red-500" : "bg-slate-200";
                      return (
                        <td key={j} className="border-l border-slate-100 p-1">
                          <button onClick={() => toggle(r, ci)} className={`h-8 w-full rounded ${bg} hover:opacity-80 transition`} />
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
            Une indisponibilité créant un conflit avec un cours planifié sera signalée à l'admin.
          </div>

          <p className="text-sm text-slate-600">
            Total cette semaine : <strong>{total}h</strong>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}