import { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, AlertTriangle, Search, BookOpen, Clock, TrendingUp, Layers, Users, BarChart3 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { apiCreateCours, apiUpdateCours, apiDeleteCours } from "@/lib/api";
import type { Cours, CoursType } from "@/types";

const TYPE_CONFIG = {
  CM: { tone: "navy" as const, icon: "📖" },
  TD: { tone: "sky" as const, icon: "✏️" },
  TP: { tone: "green" as const, icon: "💻" },
} as const;

type SortKey = "intitule" | "volume-desc" | "volume-asc" | "progression" | "type";

interface CoursForm {
  intitule: string; type: CoursType; volumeHoraire: number;
  niveauId: string; filiereId: string; enseignantIds: string[];
}
const empty: CoursForm = {
  intitule: "", type: "CM", volumeHoraire: 24,
  niveauId: "", filiereId: "", enseignantIds: [],
};

function progressionColor(pct: number): string {
  if (pct === 0) return "bg-red-500";
  if (pct < 25) return "bg-orange-500";
  if (pct < 75) return "bg-yellow-500";
  return "bg-emit-blue";
}

export default function AdminCours() {
  const { cours, enseignants, niveaux, refresh } = useData();
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("intitule");
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

  // Statistiques
  const stats = useMemo(() => {
    const total = cours.length;
    const volumeTotal = cours.reduce((a, c) => a + c.volumeHoraire, 0);
    const heuresPlanifiees = cours.reduce((a, c) => a + c.heuresPlanifiees, 0);
    const progressionMoyenne = volumeTotal > 0 ? Math.round((heuresPlanifiees / volumeTotal) * 100) : 0;
    return { total, volumeTotal, heuresPlanifiees, progressionMoyenne };
  }, [cours]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    let result = cours.filter(c =>
      (!search || c.intitule.toLowerCase().includes(search.toLowerCase())) &&
      (!filterNiveau || c.niveauLibelle === filterNiveau) &&
      (!filterFiliere || c.filiereLibelle === filterFiliere) &&
      (!filterType || c.type === filterType)
    );
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "intitule": return a.intitule.localeCompare(b.intitule);
        case "volume-desc": return b.volumeHoraire - a.volumeHoraire;
        case "volume-asc": return a.volumeHoraire - b.volumeHoraire;
        case "progression": {
          const pA = a.volumeHoraire > 0 ? a.heuresPlanifiees / a.volumeHoraire : 0;
          const pB = b.volumeHoraire > 0 ? b.heuresPlanifiees / b.volumeHoraire : 0;
          return pA - pB;
        }
        case "type": return a.type.localeCompare(b.type);
        default: return 0;
      }
    });
    return result;
  }, [cours, search, filterNiveau, filterFiliere, filterType, sortBy]);

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

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <BookOpen className="h-5 w-5 text-emit-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total cours</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.volumeTotal}h</p>
              <p className="text-xs text-slate-500">Volume total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.heuresPlanifiees}h</p>
              <p className="text-xs text-slate-500">Heures planifiées</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.progressionMoyenne}%</p>
              <p className="text-xs text-slate-500">Progression moyenne</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardBody>
          {/* Filtres et tri */}
          <div className="mb-4 grid gap-3 sm:grid-cols-5">
            <div className="relative sm:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emit-blue focus:outline-none focus:ring-1 focus:ring-emit-blue"
              />
            </div>
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
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
                value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
              >
                <option value="intitule">Tri : Intitulé</option>
                <option value="volume-desc">Volume ↓</option>
                <option value="volume-asc">Volume ↑</option>
                <option value="progression">Progression</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-center text-slate-400">Aucun cours ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const cfg = TYPE_CONFIG[c.type];
                const pct = c.volumeHoraire > 0 ? (c.heuresPlanifiees / c.volumeHoraire) * 100 : 0;
                const restantes = c.volumeHoraire - c.heuresPlanifiees;
                return (
                  <div
                    key={c.id}
                    className="group rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cfg.icon}</span>
                          <h3 className="font-semibold text-slate-800 truncate">{c.intitule}</h3>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <Badge tone={cfg.tone}>{c.type}</Badge>
                          <Badge tone="gray">{c.niveauLibelle} • {c.filiereLibelle}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="rounded p-2 hover:bg-slate-200 transition-colors" title="Modifier" onClick={() => openEdit(c)}>
                          <Edit2 className="h-4 w-4 text-slate-600" />
                        </button>
                        <button className="rounded p-2 hover:bg-red-100 transition-colors" title="Supprimer" onClick={() => setConfirm(c)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Volume et avancement */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          <Clock className="inline h-3.5 w-3.5 mr-1" />
                          Volume horaire
                        </span>
                        <span className="font-semibold">{c.volumeHoraire}h</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${progressionColor(pct)}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {c.heuresPlanifiees}h planifiées
                          </span>
                          <span className={`font-medium ${restantes > 0 ? "text-slate-600" : "text-green-600"}`}>
                            {restantes > 0 ? `${restantes}h restantes` : "✅ Complet"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enseignants */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Enseignants
                      </p>
                      {c.enseignantIds.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Non assignés</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {enseignants
                            .filter(e => c.enseignantIds.includes(e.id))
                            .map(e => (
                              <Badge key={e.id} tone="sky">
                                {e.prenom[0]}. {e.nom}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 text-xs text-slate-500">{filtered.length} résultat(s)</div>
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
              onChange={e => setForm(p => ({ ...p, type: e.target.value as CoursType }))}
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
          <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500 shrink-0" />
          <div>
            <p className="text-sm text-slate-700">
              Supprimer <strong>{confirm?.intitule}</strong> ?
            </p>
            {confirm && confirm.heuresPlanifiees > 0 && (
              <p className="mt-1 text-xs text-orange-600">
                ⚠️ Ce cours a {confirm.heuresPlanifiees}h déjà planifiées dans l'EDT — la suppression peut affecter le planning.
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">Cette action est irréversible.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}