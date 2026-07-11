import { useCallback, useEffect, useState } from "react";
import { Save, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";
import { apiDisposEnseignant, apiSaveDisponibilites, type Dispo } from "@/lib/api";
import type { Enseignant } from "@/types";
const CRENEAUX = [
  "07h00 - 08h00", "08h00 - 09h00", "09h00 - 10h00", "10h00 - 11h00", "11h00 - 12h00"
  ,"14h00 - 15h00", "15h00 - 16h00", "16h00 - 17h00", "17h00 - 18h00",
] as const;
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;
const NB_CRENEAUX = CRENEAUX.length;
const NB_JOURS = JOURS.length;

type State = "dispo" | "indispo" | "vide";

function disposToGrid(dispos: Dispo[]): State[][] {
  const grid: State[][] = Array.from({ length: NB_CRENEAUX }, () =>
    Array(NB_JOURS).fill("vide" as State)
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
  return grid.flat().filter((v) => v === "dispo").length * 1;
}

export default function AdminDisponibilites() {
  const { enseignants, semestres, refresh } = useData();
  const [selectedId, setSelectedId] = useState<string>("");
  const [semestreId, setSemestreId] = useState<string>("");
  const [grid, setGrid] = useState<State[][]>(() =>
    Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [loadingTeacher, setLoadingTeacher] = useState(false);

  useEffect(() => {
    if (enseignants.length > 0 && !selectedId) {
      setSelectedId(enseignants[0].id);
    }
  }, [enseignants, selectedId]);

  useEffect(() => {
    if (semestres.length > 0 && !semestreId) {
      const publie = [...semestres].reverse().find(s => s.statut === "publie");
      setSemestreId((publie ?? semestres[semestres.length - 1]).id);
    }
  }, [semestres, semestreId]);

  const loadDispos = useCallback(async (enseignantId: string, semId: string) => {
    if (!enseignantId || !semId) return;
    setLoadingTeacher(true);
    setError(null);
    try {
      const data = await apiDisposEnseignant(enseignantId, semId);
      setGrid(data.length > 0 ? disposToGrid(data) : Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State)));
    } catch (e: any) {
      setError(e.message ?? "Erreur lors du chargement des disponibilités");
      setGrid(Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State)));
    } finally {
      setLoadingTeacher(false);
      setChanged(false);
    }
  }, []);

  useEffect(() => { loadDispos(selectedId, semestreId); }, [selectedId, semestreId, loadDispos]);

  const toggle = (row: number, col: number) => {
    setGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      newGrid[row][col] = newGrid[row][col] === "vide" ? "dispo" : newGrid[row][col] === "dispo" ? "indispo" : "vide";
      return newGrid;
    });
    setChanged(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedId) return setError("Veuillez sélectionner un enseignant");
    if (!semestreId) return setError("Veuillez sélectionner un semestre");
    setSaving(true);
    setError(null);
    try {
      const disponibilites: Dispo[] = [];
      for (let row = 0; row < NB_CRENEAUX; row++) {
        for (let col = 0; col < NB_JOURS; col++) {
          const state = grid[row][col];
          if (state !== "vide") {
            disponibilites.push({ jour: JOURS[col], creneau: CRENEAUX[row], estDisponible: state === "dispo", estIndisponible: state === "indispo" });
          }
        }
      }
      await apiSaveDisponibilites(selectedId, semestreId, disponibilites);
      setSaved(true);
      setChanged(false);
      await refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  const totalHours = countHours(grid);
  const current = enseignants.find((e) => e.id === selectedId);

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
          disabled={saving || loadingTeacher}
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> ✓ Disponibilités enregistrées avec succès
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Enseignant :</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 min-w-[240px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20">
              {enseignants.map((e: Enseignant) => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.specialite}</option>
              ))}
            </select>
            <label className="text-sm font-medium text-slate-700">Semestre :</label>
            <select value={semestreId} onChange={(e) => setSemestreId(e.target.value)}
              className="h-10 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20">
              {semestres.map(s => (
                <option key={s.id} value={s.id}>{s.libelle} — {s.annee}</option>
              ))}
            </select>
            {current && <Badge tone={current.statut === "Permanent" ? "green" : current.statut === "Vacataire" ? "orange" : "purple"}>
              {current.statut === "Permanent" ? "Permanent" : current.statut === "Vacataire" ? "Vacataire" : "Invité"}
            </Badge>}
            {changed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse">
                <AlertTriangle className="h-3 w-3" /> Modifications non enregistrées
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-slate-600">Légende :</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-green-500 shadow-sm" /> Disponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-red-500 shadow-sm" /> Indisponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-slate-200 border border-slate-300" /> Non renseigné</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">Cliquez pour basculer</span>
          </div>

          {loadingTeacher ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emit-sky" />
                <p className="text-sm text-slate-500">Chargement des disponibilités...</p>
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
                  {CRENEAUX.map((creneau, row) => (
                    <tr key={creneau} className="group">
                      <td className="sticky left-0 z-10 bg-slate-50/90 px-3 py-2.5 text-xs font-mono text-slate-600 border-r border-slate-200 font-medium">{creneau}</td>
                      {JOURS.map((_, col) => {
                        const value = grid[row]?.[col] || "vide";
                        const isDispo = value === "dispo";
                        const isIndispo = value === "indispo";
                        return (
                          <td key={col} className="border border-slate-100 p-1">
                            <button onClick={() => toggle(row, col)}
                              className={`relative h-10 w-full rounded-lg border-2 transition-all duration-150 ${
                                isDispo ? "bg-green-100 border-green-400 hover:bg-green-200 hover:border-green-500"
                                : isIndispo ? "bg-red-100 border-red-400 hover:bg-red-200 hover:border-red-500"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                              title={`${JOURS[col]} ${creneau}: ${isDispo ? "Disponible" : isIndispo ? "Indisponible" : "Non renseigné"}`}>
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
          {changed && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Modifications non enregistrées. Cliquez sur "Sauvegarder".
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Synthèse hebdomadaire" subtitle={current ? `${current.prenom} ${current.nom}` : ""} />
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-2xl font-bold text-white shadow-md">{totalHours}h</div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Heures disponibles</p>
                <p className="text-xs text-slate-500">{grid.flat().filter((v) => v === "dispo").length} créneaux · {grid.flat().filter((v) => v === "indispo").length} indisponibilités</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Actions rapides" />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => { setGrid(Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("dispo" as State))); setChanged(true); }}>
                Tout disponible
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setGrid(Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State))); setChanged(true); }}>
                Tout effacer
              </Button>
              <Button size="sm" variant="outline" onClick={() => { if (selectedId) loadDispos(selectedId, semestreId); }}>
                Recharger
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}