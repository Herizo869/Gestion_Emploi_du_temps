import { useState } from "react";
import { Plus, Trash2, ChevronDown, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useData } from "@/context/DataContext";
import { apiCreateNiveau, apiCreateFiliere, apiDeleteFiliere } from "@/lib/api";
import type { Filiere } from "@/types";




export default function AdminNiveaux() {
  const [confirmF, setConfirmF] = useState<Filiere & { niveauLibelle?: string } | null>(null);
  const { niveaux, refresh } = useData();

  const handleDeleteFiliere = async () => {
    if (!confirmF) return;
    try {
      await apiDeleteFiliere(confirmF.id);
      await refresh();
      setConfirmF(null);
    } catch { setConfirmF(null); }
  };
  

  // State modal Niveau
  const [openN, setOpenN] = useState(false);
  const [libelle, setLibelle] = useState<"L1" | "L2" | "L3" | "M1" | "M2">("L1");
  const [effectifMax, setEffectifMax] = useState(100);
  const [savingN, setSavingN] = useState(false);
  const [errorN, setErrorN] = useState<string | null>(null);

  // State modal Filière
  const [openF, setOpenF] = useState(false);
  const [fLibelle, setFLibelle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fNiveauId, setFNiveauId] = useState("");
  const [savingF, setSavingF] = useState(false);
  const [errorF, setErrorF] = useState<string | null>(null);

  const handleCreateNiveau = async () => {
    setErrorN(null);
    setSavingN(true);
    try {
      await apiCreateNiveau({ libelle, effectifMax: Number(effectifMax) });
      await refresh();
      setOpenN(false);
      setLibelle("L1"); setEffectifMax(100);
    } catch (e: any) {
      setErrorN(e.message ?? "Erreur lors de la création");
    } finally {
      setSavingN(false);
    }
  };

  const handleCreateFiliere = async () => {
    if (!fLibelle) return setErrorF("Le libellé est requis");
    if (!fNiveauId) return setErrorF("Le niveau parent est requis");
    setErrorF(null);
    setSavingF(true);
    try {
      await apiCreateFiliere(fNiveauId, { libelle: fLibelle, description: fDesc });
      await refresh();
      setOpenF(false);
      setFLibelle(""); setFDesc(""); setFNiveauId("");
    } catch (e: any) {
      setErrorF(e.message ?? "Erreur lors de la création");
    } finally {
      setSavingF(false);
    }
  };

  const openAddFiliere = (niveauId?: string) => {
    setFNiveauId(niveauId ?? niveaux[0]?.id ?? "");
    setFLibelle(""); setFDesc(""); setErrorF(null);
    setOpenF(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Niveaux & Filières</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hiérarchie académique</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openAddFiliere()}>
            Ajouter filière
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setErrorN(null); setOpenN(true); }}>
            Ajouter niveau
          </Button>
        </div>
      </div>

      {niveaux.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">Aucun niveau créé.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {niveaux.map((n) => (
          <Card key={n.id}>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge tone="navy">{n.libelle}</Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Effectif max : <strong>{n.effectifMax}</strong>
                  </span>
                </div>
                {/* Suppression niveau désactivée — pas d'endpoint DELETE côté backend */}
                <button
                  className="rounded p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Ajouter une filière à ce niveau"
                  onClick={() => openAddFiliere(n.id)}
                >
                  <Plus className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <ChevronDown className="h-3 w-3 dark:text-slate-400" /> Filières ({n.filieres.length})
              </div>

              <ul className="space-y-2">
                {n.filieres.length === 0 && (
                  <li className="text-xs text-slate-400 dark:text-slate-500 px-1">Aucune filière</li>
                )}
                {n.filieres.map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{f.libelle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {f.description} — <span className="tabular-nums">{f.nbCours}</span> cours
                      </p>
                    </div>
                    {/* Suppression filière désactivée — pas d'endpoint DELETE côté backend */}
                    <div className="flex gap-1">
                      <button
                        className="rounded p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="Supprimer la filière"
                        onClick={() => setConfirmF(f)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Modal Niveau */}
      <Modal
        open={openN}
        onClose={() => setOpenN(false)}
        title="Ajouter un niveau"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenN(false)}>Annuler</Button>
            <Button onClick={handleCreateNiveau} disabled={savingN}>
              {savingN ? "Création..." : "Enregistrer"}
            </Button>
          </>
        }
      >
        {errorN && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{errorN}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Libellé</label>
            <select
              value={libelle}
              onChange={e => setLibelle(e.target.value as any)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option>L1</option><option>L2</option><option>L3</option>
              <option>M1</option><option>M2</option>
            </select>
          </div>
          <Input
            label="Effectif maximum"
            type="number"
            placeholder="100"
            value={String(effectifMax)}
            onChange={e => setEffectifMax(Number(e.target.value))}
          />
        </div>
      </Modal>

      <Modal
        open={openF}
        onClose={() => setOpenF(false)}
        title="Ajouter une filière"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenF(false)}>Annuler</Button>
            <Button onClick={handleCreateFiliere} disabled={savingF}>
              {savingF ? "Création..." : "Enregistrer"}
            </Button>
          </>
        }
      >
        {errorF && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{errorF}</p>
        )}
        <div className="grid gap-3">
          <Input
            label="Libellé"
            placeholder="INFO"
            value={fLibelle}
            onChange={e => setFLibelle(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Informatique"
            value={fDesc}
            onChange={e => setFDesc(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium dark:text-slate-300">Niveau parent</label>
            <select
              value={fNiveauId}
              onChange={e => setFNiveauId(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">— Sélectionner —</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.libelle}</option>)}
            </select>
          </div>
        </div>
      </Modal>
      <Modal
        open={!!confirmF}
        onClose={() => setConfirmF(null)}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmF(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDeleteFiliere}>Supprimer</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Supprimer la filière <strong>{confirmF?.libelle}</strong> ?
            {(confirmF?.nbCours ?? 0) > 0 && (
              <span className="block mt-1 text-orange-600 dark:text-orange-400 text-xs">
                Cette filière contient {confirmF?.nbCours} cours qui seront également supprimés.
              </span>
            )}
          </p>
        </div>
      </Modal>
    </div>
  );
}