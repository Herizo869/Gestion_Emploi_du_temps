import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, AlertTriangle, Search, Users, Building2, DoorOpen, TrendingUp, Layers } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useData } from "@/context/DataContext";
import { apiCreateSalle, apiUpdateSalle, apiDeleteSalle } from "@/lib/api";
import type { Salle } from "@/types";

const TYPE_CONFIG = {
  Cours: { tone: "blue" as const, icon: "📚" },
  TP: { tone: "green" as const, icon: "💻" },
  Amphi: { tone: "purple" as const, icon: "🎓" },
  Examen: { tone: "orange" as const, icon: "📝" },
  Reunion: { tone: "gray" as const, icon: "🤝" },
} as const;

type SortKey = "numero" | "capacite-asc" | "capacite-desc" | "occupation" | "disponible";

const emptyForm: Omit<Salle, "id"> = {
  numero: "", batiment: "", capacite: 40,
  type: "Cours", disponible: true, occupation: 0,
};

function occupationColor(pct: number): string {
  if (pct > 90) return "bg-red-500";
  if (pct > 70) return "bg-orange-500";
  if (pct > 40) return "bg-yellow-500";
  return "bg-emit-blue";
}

export default function AdminSalles() {
  const navigate = useNavigate();
  const { salles: items, refresh } = useData();

  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Salle | null>(null);
  const [confirm, setConfirm] = useState<Salle | null>(null);
  const [form, setForm] = useState<Omit<Salle, "id">>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterBatiment, setFilterBatiment] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("numero");

  // Statistiques
  const stats = useMemo(() => {
    const total = items.length;
    const disponibles = items.filter(s => s.disponible).length;
    const capMoyenne = total > 0 ? Math.round(items.reduce((a, s) => a + s.capacite, 0) / total) : 0;
    const occMoyenne = total > 0 ? Math.round(items.reduce((a, s) => a + s.occupation, 0) / total) : 0;
    return { total, disponibles, capMoyenne, occMoyenne };
  }, [items]);

  // Bâtiments uniques pour le filtre
  const batiments = useMemo(
    () => [...new Set(items.map(s => s.batiment).filter(Boolean))].sort(),
    [items]
  );

  // Filtrage + tri
  const filtered = useMemo(() => {
    let result = items.filter(s =>
      (!search || s.numero.toLowerCase().includes(search.toLowerCase()) || s.batiment.toLowerCase().includes(search.toLowerCase())) &&
      (!filterType || s.type === filterType) &&
      (!filterBatiment || s.batiment === filterBatiment)
    );
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "numero": return a.numero.localeCompare(b.numero);
        case "capacite-asc": return a.capacite - b.capacite;
        case "capacite-desc": return b.capacite - a.capacite;
        case "occupation": return b.occupation - a.occupation;
        case "disponible": return a.disponible === b.disponible ? 0 : a.disponible ? -1 : 1;
        default: return 0;
      }
    });
    return result;
  }, [items, search, filterType, filterBatiment, sortBy]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  };

  const openEdit = (s: Salle) => {
    setEditTarget(s);
    setForm({
      numero: s.numero,
      batiment: s.batiment,
      capacite: s.capacite,
      type: s.type,
      disponible: s.disponible,
      occupation: s.occupation
    });
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.numero?.trim()) {
      return setError("Le numéro de salle est requis");
    }
    setSaving(true);
    setError(null);

    try {
      if (editTarget) {
        await apiUpdateSalle(editTarget.id, form);
      } else {
        await apiCreateSalle(form);
      }
      await refresh();        // Mise à jour de la liste via API + contexte
      setOpen(false);
    } catch (e: any) {
      setError(e.message ?? "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await apiDeleteSalle(confirm.id);
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setConfirm(null);
    }
  };

  const toggleDispo = async (s: Salle) => {
    try {
      await apiUpdateSalle(s.id, { ...s, disponible: !s.disponible });
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const updateForm = (key: keyof typeof form) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = key === "capacite" 
        ? Number(e.target.value) 
        : e.target.value;
      setForm(prev => ({ ...prev, [key]: value }));
    };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Salles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} salles configurées</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Ajouter une salle
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Building2 className="h-5 w-5 text-emit-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total salles</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <DoorOpen className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.disponibles}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Salles disponibles</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.capMoyenne}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Capacité moyenne</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.occMoyenne}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Occupation moyenne</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardBody>
          {/* Filtres et tri */}
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emit-blue focus:outline-none focus:ring-1 focus:ring-emit-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={filterType} onChange={e => setFilterType(e.target.value)}
            >
              <option value="">Tous types</option>
              {Object.keys(TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={filterBatiment} onChange={e => setFilterBatiment(e.target.value)}
            >
              <option value="">Tous bâtiments</option>
              {batiments.map(b => <option key={b} value={b}>Bâtiment {b}</option>)}
            </select>
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
                value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
              >
                <option value="numero">Tri : Numéro</option>
                <option value="capacite-asc">Capacité ↑</option>
                <option value="capacite-desc">Capacité ↓</option>
                <option value="occupation">Occupation</option>
                <option value="disponible">Disponibilité</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-center text-slate-400 dark:text-slate-500">Aucune salle ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => {
                const cfg = TYPE_CONFIG[s.type];
                return (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/admin/edt`)}
                    className="group rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer dark:border-slate-700 dark:from-slate-800 dark:to-slate-700"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`grid h-10 w-10 place-items-center rounded-lg text-lg ${s.disponible ? "bg-green-50" : "bg-slate-100"}`}>
                          {cfg.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg leading-tight">{s.numero}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <Building2 className="inline h-3 w-3 mr-0.5" />
                            Bâtiment {s.batiment}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="rounded p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Modifier" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                          <Edit2 className="h-4 w-4 text-slate-600" />
                        </button>
                        <button className="rounded p-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Supprimer" onClick={(e) => { e.stopPropagation(); setConfirm(s); }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Type et capacité */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge tone={cfg.tone}>{cfg.icon} {s.type}</Badge>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        <Users className="inline h-3.5 w-3.5 mr-1" />
                        {s.capacite} places
                      </span>
                    </div>

                    {/* Disponibilité */}
                    <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-lg mb-3 dark:bg-slate-700/50">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Disponible</span>
                      <button onClick={() => toggleDispo(s)} className="focus:outline-none">
                        <span className={`relative inline-block h-6 w-11 rounded-full transition-all duration-200 ${s.disponible ? "bg-green-500 shadow-sm shadow-green-200" : "bg-slate-300"}`}>
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${s.disponible ? "left-5" : "left-0.5"}`} />
                        </span>
                      </button>
                    </div>

                    {/* Occupation */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-600 dark:text-slate-400">Occupation</span>
                        <span className={`font-semibold tabular-nums ${s.occupation > 90 ? "text-red-600 dark:text-red-400" : s.occupation > 70 ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-300"}`}>
                          {s.occupation}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${occupationColor(s.occupation)}`}
                          style={{ width: `${s.occupation}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{filtered.length} résultat(s)</div>
        </CardBody>
      </Card>

      {/* Modal Ajout / Modification */}
      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title={editTarget ? "Modifier la salle" : "Ajouter une salle"}
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
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input 
            label="Numéro" 
            placeholder="A103" 
            value={form.numero} 
            onChange={updateForm("numero")} 
          />
          <Input 
            label="Bâtiment" 
            placeholder="A" 
            value={form.batiment} 
            onChange={updateForm("batiment")} 
          />
          <Input 
            label="Capacité" 
            type="number" 
            placeholder="40" 
            value={String(form.capacite)} 
            onChange={updateForm("capacite")} 
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
            <select 
              value={form.type} 
              onChange={updateForm("type")} 
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="Cours">Cours</option>
              <option value="TP">TP</option>
              <option value="Amphi">Amphi</option>
              <option value="Examen">Examen</option>
              <option value="Reunion">Réunion</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input 
              type="checkbox" 
              checked={form.disponible} 
              onChange={e => setForm(p => ({ ...p, disponible: e.target.checked }))} 
            />
            Disponible
          </label>
        </div>
      </Modal>

      {/* Modal Confirmation Suppression */}
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
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Supprimer la salle <strong>{confirm?.numero}</strong> ?
            </p>
            {confirm && confirm.occupation > 0 && (
              <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                ⚠️ Cette salle a {confirm.occupation}% d'occupation — la suppression peut affecter l'EDT.
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Cette action est irréversible.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}