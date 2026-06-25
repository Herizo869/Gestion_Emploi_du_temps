import { useState, useEffect } from "react";
import { AlertTriangle, Save, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { CRENEAUX, JOURS } from "@/data/mock";
import { useData } from "@/context/DataContext";
import { apiSaveDisponibilites } from "@/lib/api";
import type { Enseignant } from "@/types";

type State = "dispo" | "indispo" | "vide";

export default function AdminDisponibilites() {
  const { enseignants, refresh } = useData();
  const [selectedEnseignantId, setSelectedEnseignantId] = useState<string>("");
  const [grid, setGrid] = useState<State[][]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisation de la grille
  useEffect(() => {
    if (enseignants.length > 0 && !selectedEnseignantId) {
      setSelectedEnseignantId(enseignants[0].id);
    }
    // Grille vide par défaut
    setGrid(CRENEAUX.map(() => JOURS.map(() => "vide" as State)));
  }, [enseignants, selectedEnseignantId]);

  const toggle = (row: number, col: number) => {
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      const current = newGrid[row][col];
      newGrid[row][col] = current === "vide" ? "dispo" : current === "dispo" ? "indispo" : "vide";
      return newGrid;
    });
    setSaved(false);
  };

  const hoursDispo = grid.flat().filter(v => v === "dispo").length * 1.5;

  const handleSave = async () => {
    if (!selectedEnseignantId) return setError("Veuillez sélectionner un enseignant");

    setSaving(true);
    setError(null);

    try {
      // Conversion de la grille en format attendu par le backend
      const disponibilites = grid.flatMap((row, rowIndex) =>
        row.map((state, colIndex) => ({
          jour: JOURS[colIndex],
          creneau: CRENEAUX[rowIndex],
          estDisponible: state === "dispo",
          estIndisponible: state === "indispo"
        }))
      ).filter(d => d.estDisponible || d.estIndisponible);

      await apiSaveDisponibilites(selectedEnseignantId, disponibilites);
      
      setSaved(true);
      await refresh(); // Rafraîchissement du contexte

      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la sauvegarde");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const currentEnseignant = enseignants.find(e => e.id === selectedEnseignantId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disponibilités des Enseignants</h1>
          <p className="text-sm text-slate-500">Gestion des disponibilités hebdomadaires</p>
        </div>
        <Button 
          leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Disponibilités enregistrées avec succès
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium">Enseignant :</label>
            <select 
              value={selectedEnseignantId} 
              onChange={(e) => setSelectedEnseignantId(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            >
              {enseignants.map((e: Enseignant) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom} — {e.specialite}
                </option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-500" />Disponible</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" />Indisponible</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200" />Non renseigné</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-slate-50 px-3 py-3 text-left text-xs text-slate-500">Créneau</th>
                  {JOURS.map((jour) => (
                    <th key={jour} className="bg-slate-50 px-3 py-3 text-center text-xs text-slate-700 border-l border-slate-200">
                      {jour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRENEAUX.map((creneau, row) => (
                  <tr key={creneau} className="border-b border-slate-100">
                    <td className="bg-slate-50/70 px-3 py-2 text-xs font-mono text-slate-600">{creneau}</td>
                    {JOURS.map((_, col) => {
                      const value = grid[row]?.[col] || "vide";
                      const bg = value === "dispo" ? "bg-green-500" : value === "indispo" ? "bg-red-500" : "bg-slate-200";
                      return (
                        <td key={col} className="border-l border-slate-100 p-1 text-center">
                          <button
                            onClick={() => toggle(row, col)}
                            className={`h-9 w-full rounded transition hover:brightness-110 ${bg}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Synthèse" subtitle="Heures disponibles cette semaine" />
        <CardBody>
          <p className="text-3xl font-semibold text-emit-blue">{hoursDispo} h</p>
          <p className="text-sm text-slate-500">déclarées disponibles</p>
        </CardBody>
      </Card>
    </div>
  );
}