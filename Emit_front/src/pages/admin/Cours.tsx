import { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { apiCreateCours, apiUpdateCours, apiDeleteCours } from "@/lib/api";
import type { Cours } from "@/types";

const typeTone = { CM: "navy", TD: "sky", TP: "green" } as const;

interface CoursForm {
  intitule: string; type: import("@/types").CoursType; volumeHoraire: number;
  niveauId: string; filiereId: string; enseignantIds: string[];
}
const empty: CoursForm = {
  intitule: "", type: "CM", volumeHoraire: 24,
  niveauId: "", filiereId: "", enseignantIds: [],
};

export default function AdminCours() {
  const { cours, enseignants, niveaux, refresh } = useData();
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterType, setFilterType] = useState("");
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Cours | null>(null);
  const [confirm, setConfirm] = useState<Cours | null>(null);
  const [form, setForm] = useState<CoursForm>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filières du niveau sélectionné dans le formulaire
  const filieresDuNiveau = useMemo(
    () => niveaux.find(n => n.id === form.niveauId)?.filieres ?? [],
    [niveaux, form.niveauId]
  );

  // Filières dispo pour le filtre
  const toutesLesFilieres = useMemo(
    () => [...new Set(niveaux.flatMap(n => n.filieres.map(f => f.libelle)))],
    [niveaux]
  );

  const filtered = useMemo(() =>
    cours.filter(c =>
      (!filterNiveau || c.niveauLibelle === filterNiveau) &&
      (!filterFiliere || c.filiereLibelle === filterFiliere) &&
      (!filterType || c.type === filterType)
    ), [cours, filterNiveau, filterFiliere, filterType]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...empty, niveauId: niveaux[0]?.id ?? "" });
    setError(null);
    setOpen(true);
  };

  const openEdit = (c: Cours) => {
    setEditTarget(c);
    setForm({
      intitule: c.intitule,
      type: c.type,
      volumeHoraire: c.volumeHoraire,
      niveauId: c.niveauId,
      filiereId: c.filiereId,
      enseignantIds: c.enseignantIds,
    });
    setError(null);
    setOpen(true);
  };

  const toggleEnseignant = (id: string) => {
    setForm(prev => ({
      ...prev,
      enseignantIds: prev.enseignantIds.includes(id)
        ? prev.enseignantIds.filter(x => x !== id)
        : [...prev.enseignantIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.intitule) return setError("L'intitulé est requis");
    if (!form.niveauId) return setError("Le niveau est requis");
    if (!form.filiereId) return setError("La filière est requise");
    setSaving(true); setError(null);
    try {
      const payload = { ...form, volumeHoraire: Number(form.volumeHoraire) };
      if (editTarget) {
        await apiUpdateCours(editTarget.id, payload);
      } else {
        await apiCreateCours(payload);
      }
      await refresh();
      setOpen(false);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try { await apiDeleteCours(confirm.id); await refresh(); setConfirm(null); }
    catch { setConfirm(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cours</h1>
          <p className="text-sm text-slate-500">{cours.length} cours enregistrés</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>Ajouter un cours</Button>
      </div>

      <Card>
        <CardBody>
          {/* Filtres */}
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}
            >
              <option value="">Tous niveaux</option>
              {niveaux.map(n => <option key={n.id}>{n.libelle}</option>)}
            </select>
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)}
            >
              <option value="">Toutes filières</option>
              {toutesLesFilieres.map(f => <option key={f}>{f}</option>)}
            </select>
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={filterType} onChange={e => setFilterType(e.target.value)}
            >
              <option value="">Tous types</option>
              <option>CM</option><option>TD</option><option>TP</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Intitulé</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Volume</th>
                  <th className="py-2.5 pr-3">Avancement</th>
                  <th className="py-2.5 pr-3">Niveau</th>
                  <th className="py-2.5 pr-3">Filière</th>
                  <th className="py-2.5 pr-3">Enseignants</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">Aucun cours</td></tr>
                )}
                {filtered.map((c) => {
                  const pct = c.volumeHoraire > 0 ? (c.heuresPlanifiees / c.volumeHoraire) * 100 : 0;
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 pr-3 font-medium text-slate-800">{c.intitule}</td>
                      <td className="py-3 pr-3"><Badge tone={typeTone[c.type]}>{c.type}</Badge></td>
                      <td className="py-3 pr-3 tabular-nums">{c.volumeHoraire}h</td>
                      <td className="py-3 pr-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full ${pct === 0 ? "bg-red-500" : "bg-emit-blue"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-slate-500">{c.heuresPlanifiees}h/{c.volumeHoraire}h</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">{c.niveauLibelle}</td>
                      <td className="py-3 pr-3">{c.filiereLibelle}</td>
                      <td className="py-3 pr-3">
                        {c.enseignantIds.length === 0
                          ? <span className="text-slate-400">—</span>
                          : enseignants
                              .filter(e => c.enseignantIds.includes(e.id))
                              .map(e => `${e.prenom[0]}. ${e.nom}`)
                              .join(", ")
                        }
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button className="rounded p-1.5 hover:bg-slate-200" title="Modifier" onClick={() => openEdit(c)}>
                            <Edit2 className="h-4 w-4 text-slate-500" />
                          </button>
                          <button className="rounded p-1.5 hover:bg-red-100" title="Supprimer" onClick={() => setConfirm(c)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-slate-500">{filtered.length} résultat(s)</div>
        </CardBody>
      </Card>

      {/* Modal Ajout / Édition */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editTarget ? "Modifier le cours" : "Ajouter un cours"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </>
        }
      >
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Intitulé" placeholder="Algorithmique"
            value={form.intitule}
            onChange={e => setForm(p => ({ ...p, intitule: e.target.value }))}
          />
          <Input
            label="Volume horaire (h)" type="number" placeholder="24"
            value={String(form.volumeHoraire)}
            onChange={e => setForm(p => ({ ...p, volumeHoraire: Number(e.target.value) }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as import("@/types").CoursType }))}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option>CM</option><option>TD</option><option>TP</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Niveau</label>
            <select
              value={form.niveauId}
              onChange={e => setForm(p => ({ ...p, niveauId: e.target.value, filiereId: "" }))}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {niveaux.map(n => <option key={n.id} value={n.id}>{n.libelle}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Filière</label>
            <select
              value={form.filiereId}
              onChange={e => setForm(p => ({ ...p, filiereId: e.target.value }))}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {filieresDuNiveau.map(f => <option key={f.id} value={f.id}>{f.libelle}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Enseignants qualifiés</label>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {enseignants.length === 0 && (
                <p className="py-2 text-center text-xs text-slate-400">Aucun enseignant disponible</p>
              )}
              {enseignants.map(e => (
                <label key={e.id} className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.enseignantIds.includes(e.id)}
                    onChange={() => toggleEnseignant(e.id)}
                  />
                  {e.prenom} {e.nom}
                  <span className="text-xs text-slate-500">— {e.specialite}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Suppression */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
          <p className="text-sm text-slate-700">
            Supprimer <strong>{confirm?.intitule}</strong> ? Cette action est irréversible.
          </p>
        </div>
      </Modal>
    </div>
  );
}