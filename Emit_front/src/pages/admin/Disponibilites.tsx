import { useCallback, useEffect, useState } from "react";
import { Save, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";
import { apiDisposEnseignant, apiSaveDisponibilites, type Dispo } from "@/lib/api";
import type { Enseignant } from "@/types";

const CRENEAUX = [
  "07h00 - 08h00",
  "08h00 - 09h00",
  "09h00 - 10h00",
  "10h00 - 11h00",
  "11h00 - 12h00",
  "14h00 - 15h00",
  "15h00 - 16h00",
  "16h00 - 17h00",
  "17h00 - 18h00",
] as const;

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

const NB_CRENEAUX = CRENEAUX.length;
const NB_JOURS = JOURS.length;

type State = "dispo" | "indispo" | "vide";

function disposToGrid(dispos: Dispo[]): State[][] {
  const grid: State[][] = Array.from({ length: NB_CRENEAUX }, () =>
    Array(NB_JOURS).fill("vide")
  );
  dispos.forEach((d) => {
    const row = CRENEAUX.indexOf(d.creneau as typeof CRENEAUX[number]);
    const col = JOURS.indexOf(d.jour as typeof JOURS[number]);
    if (row >= 0 && col >= 0) {
      grid[row][col] = d.estDisponible ? "dispo" : "indispo";
    }
  });
  return grid;
}

function countHours(grid: State[][]): number {
  return grid.flat().filter((v) => v === "dispo").length;
}

export default function AdminDisponibilites() {
  const { enseignants, semestres, refresh } = useData();
  const [selectedId, setSelectedId] = useState<string>("");
  const [semestreId, setSemestreId] = useState<string>("");
  const [grid, setGrid] = useState<State[][]>(() =>
    Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide"))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [loadingTeacher, setLoadingTeacher] = useState(false);

  // Sélection automatique du premier enseignant
  useEffect(() => {
    if (enseignants.length > 0 && !selectedId) {
      setSelectedId(enseignants[0].id);
    }
  }, [enseignants, selectedId]);

  // Sélection automatique du semestre
  useEffect(() => {
    if (semestres.length > 0 && !semestreId) {
      const publie = [...semestres].reverse().find((s) => s.statut === "publie");
      setSemestreId((publie ?? semestres[semestres.length - 1]).id);
    }
  }, [semestres, semestreId]);

  // Chargement des disponibilités
  const loadDispos = useCallback(
    async (enseignantId: string, semId: string) => {
      if (!enseignantId || !semId) return;
      setLoadingTeacher(true);
      setError(null);
      try {
        const data = await apiDisposEnseignant(enseignantId, semId);
        setGrid(
          data.length > 0
            ? disposToGrid(data)
            : Array.from({ length: NB_CRENEAUX }, () =>
                Array(NB_JOURS).fill("vide")
              )
        );
      } catch (e: any) {
        setError(e.message ?? "Erreur chargement disponibilités");
      } finally {
        setLoadingTeacher(false);
        setChanged(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDispos(selectedId, semestreId);
  }, [selectedId, semestreId, loadDispos]);

  // Changement cellule grille
  const toggle = (row: number, col: number) => {
    setGrid((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[row][col] =
        copy[row][col] === "vide"
          ? "dispo"
          : copy[row][col] === "dispo"
          ? "indispo"
          : "vide";
      return copy;
    });
    setChanged(true);
    setSaved(false);
  };

  // Sauvegarde
  const handleSave = async () => {
    if (!selectedId) {
      setError("Veuillez sélectionner un enseignant");
      return;
    }
    if (!semestreId) {
      setError("Veuillez sélectionner un semestre");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const disponibilites: Dispo[] = [];
      for (let row = 0; row < NB_CRENEAUX; row++) {
        for (let col = 0; col < NB_JOURS; col++) {
          const state = grid[row][col];
          if (state !== "vide") {
            disponibilites.push({
              jour: JOURS[col],
              creneau: CRENEAUX[row],
              estDisponible: state === "dispo",
              estIndisponible: state === "indispo",
            });
          }
        }
      }

      await apiSaveDisponibilites(selectedId, semestreId, undefined, disponibilites);

      setSaved(true);
      setChanged(false);
      await refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const totalHours = countHours(grid);
  const current = enseignants.find((e) => e.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disponibilités</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les disponibilités et indisponibilités des enseignants par créneau
          </p>
        </div>
        <div className="flex items-center gap-3">
          {changed && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse">
              <AlertTriangle className="h-3 w-3" /> Modifications non enregistrées
            </span>
          )}
          <Button
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Enseignant :</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 min-w-[240px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20"
            >
              {enseignants.map((e: Enseignant) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom} — {e.specialite}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium text-slate-700">Semestre :</label>
            <select
              value={semestreId}
              onChange={(e) => setSemestreId(e.target.value)}
              className="h-10 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20"
            >
              {semestres.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.libelle} — {s.annee}
                </option>
              ))}
            </select>

            {current && (
              <Badge
                tone={
                  current.statut.toLowerCase() === "permanent"
                    ? "green"
                    : current.statut.toLowerCase() === "vacataire"
                    ? "orange"
                    : "purple"
                }
              >
                {current.statut.toLowerCase() === "permanent"
                  ? "Permanent"
                  : current.statut.toLowerCase() === "vacataire"
                  ? "Vacataire"
                  : "Invité"}
              </Badge>
            )}
          </div>

          {/* Légende */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 rounded border border-emit-sky bg-emit-light" /> Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 rounded border border-red-300 bg-red-50" /> Indisponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 rounded border border-slate-200 bg-white" /> Non défini
            </span>
            <span className="ml-auto font-medium text-emit-navy">
              Total : <strong>{totalHours}h</strong> de disponibilité
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Grille des disponibilités */}
      <Card>
        <CardHeader
          title="Grille des disponibilités"
          subtitle={current ? `${current.prenom} ${current.nom}` : "Sélectionnez un enseignant"}
        />
        <CardBody>
          {loadingTeacher ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emit-sky" />
            </div>
          ) : !selectedId ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Clock className="h-12 w-12 mb-3" />
              <p className="text-sm">Sélectionnez un enseignant pour voir ses disponibilités</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      Créneau
                    </th>
                    {JOURS.map((jour) => (
                      <th
                        key={jour}
                        className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200"
                      >
                        {jour}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRENEAUX.map((creneau, row) => (
                    <tr key={creneau} className="group">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs font-medium text-slate-600 border-b border-slate-100 whitespace-nowrap">
                        {creneau}
                      </td>
                      {JOURS.map((jour, col) => {
                        const state = grid[row][col];
                        return (
                          <td
                            key={`${creneau}-${jour}`}
                            className="px-1 py-1 border-b border-slate-100"
                          >
                            <button
                              onClick={() => toggle(row, col)}
                              className={`h-10 w-full rounded-lg border-2 transition-all duration-150 cursor-pointer ${
                                state === "dispo"
                                  ? "border-emit-sky bg-emit-light hover:bg-emit-sky/20"
                                  : state === "indispo"
                                  ? "border-red-300 bg-red-50 hover:bg-red-100"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                              title={
                                state === "dispo"
                                  ? "Disponible — Cliquer pour rendre indisponible"
                                  : state === "indispo"
                                  ? "Indisponible — Cliquer pour réinitialiser"
                                  : "Non défini — Cliquer pour rendre disponible"
                              }
                            >
                              {state === "dispo" && (
                                <CheckCircle2 className="mx-auto h-4 w-4 text-emit-sky" />
                              )}
                              {state === "indispo" && (
                                <XCircle className="mx-auto h-4 w-4 text-red-400" />
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

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {saved && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Disponibilités enregistrées avec succès
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
