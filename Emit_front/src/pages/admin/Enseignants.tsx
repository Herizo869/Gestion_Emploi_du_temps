import { useMemo, useState } from "react";
import { Plus, Search, Edit2, Trash2, AlertTriangle, Mail, Clock, BookOpen, ExternalLink, Check, Copy, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import { apiCreateEnseignant, apiUpdateEnseignant, apiDeleteEnseignant } from "@/lib/api";
import type { Enseignant } from "@/types";

const statutTone = { Permanent: "green", Vacataire: "orange", Invite: "purple" } as const;
const empty: Omit<Enseignant, "id"> = {
  prenom: "",
  nom: "",
  email: "",
  specialite: "",
  statut: "Permanent",
  nbCours: 0,
};

/** Calcule le taux d'occupation : heures planifiées / heures disponibles */
function tauxOccupation(enseignant: Enseignant): number | null {
  const { heuresDisponibles, heuresPlanifiees } = enseignant;
  if (!heuresDisponibles || heuresDisponibles === 0) return null;
  return Math.min((heuresPlanifiees ?? 0) / heuresDisponibles, 1);
}

function occupationColor(taux: number | null): string {
  if (taux === null) return "bg-slate-200";
  if (taux > 0.8) return "bg-red-500";
  if (taux > 0.5) return "bg-orange-400";
  return "bg-green-500";
}

function occupationText(taux: number | null): string {
  if (taux === null) return "N/A";
  return `${(taux * 100).toFixed(0)}%`;
}

export default function AdminEnseignants() {
  const navigate = useNavigate();
  const { enseignants: items, refresh } = useData();
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [sortBy, setSortBy] = useState<"nom" | "dispo-desc" | "dispo-asc" | "occupation" | "cours">("nom");
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Enseignant | null>(null);
  const [confirm, setConfirm] = useState<Enseignant | null>(null);
  const [form, setForm] = useState<Omit<Enseignant, "id">>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Liste des spécialités uniques
  const specialites = useMemo(
    () => [...new Set(items.map(i => i.specialite).filter(Boolean))],
    [items]
  );

  const filtered = useMemo(() => {
    let result = items.filter(
      (e) => `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(q.toLowerCase())
        && (!statut || e.statut === statut)
        && (!specialite || e.specialite === specialite)
    );
    // Tri
    result.sort((a, b) => {
      switch (sortBy) {
        case "nom":
          return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
        case "dispo-desc":
          return (b.heuresDisponibles ?? 0) - (a.heuresDisponibles ?? 0);
        case "dispo-asc":
          return (a.heuresDisponibles ?? 0) - (b.heuresDisponibles ?? 0);
        case "occupation": {
          const tauxA = a.heuresDisponibles ? (a.heuresPlanifiees ?? 0) / a.heuresDisponibles : 0;
          const tauxB = b.heuresDisponibles ? (b.heuresPlanifiees ?? 0) / b.heuresDisponibles : 0;
          return tauxB - tauxA;
        }
        case "cours":
          return b.nbCours - a.nbCours;
        default:
          return 0;
      }
    });
    return result;
  }, [items, q, statut, specialite, sortBy]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(empty);
    setError(null);
    setOpen(true);
  };

  const openEdit = (e: Enseignant) => {
    setEditTarget(e);
    setForm({ prenom: e.prenom, nom: e.nom, email: e.email, specialite: e.specialite, statut: e.statut, nbCours: e.nbCours });
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.prenom || !form.nom || !form.email) return setError("Prénom, nom et email requis");
    setSaving(true); setError(null);
    try {
      const { id, nbCours, ...payload } = form as any;
      if (editTarget) {
        await apiUpdateEnseignant(editTarget.id, payload);
      } else {
        await apiCreateEnseignant(payload);
      }
      await refresh();
      setOpen(false);
    } catch (e: any) {
      setError(e.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await apiDeleteEnseignant(confirm.id);
      await refresh();
      setConfirm(null);
    } catch { setConfirm(null); }
  };

  const copyEmail = async (email: string, id: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) { console.warn("Impossible de copier l'email", err); }
  };

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enseignants</h1>
          <p className="text-sm text-slate-500">Gestion du corps enseignant ({items.length})</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>Ajouter</Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Rechercher (nom, email...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              <option value="">Tous statuts</option>
              <option value="Permanent">Permanent</option>
              <option value="Vacataire">Vacataire</option>
              <option value="Invite">Invité</option>
            </select>
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
            >
              <option value="">Toutes spécialités</option>
              {specialites.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm col-span-3 sm:col-span-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="nom">Trier : Nom A-Z</option>
              <option value="dispo-desc">Trier : + disponibles</option>
              <option value="dispo-asc">Trier : - disponibles</option>
              <option value="occupation">Trier : Occupation ↓</option>
              <option value="cours">Trier : + de cours</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-center text-slate-400">Aucun enseignant ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => {
                const taux = tauxOccupation(e);
                const isCopied = copiedId === e.id;
                const isOverloaded = taux !== null && taux > 0.8;

                return (
                  <div
                    key={e.id}
                    className={`group rounded-xl border bg-white p-5 shadow-sm hover:shadow-lg transition-all duration-200 ${
                      isOverloaded
                        ? "border-red-200 hover:border-red-300"
                        : "border-slate-200 hover:border-emit-sky/40"
                    }`}
                  >
                    {/* ── Header : avatar + actions ── */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emit-navy to-emit-sky text-sm font-bold text-white shadow-md">
                            {e.prenom[0]}{e.nom[0]}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${
                              e.statut === "Permanent" ? "bg-green-500" : e.statut === "Vacataire" ? "bg-orange-400" : "bg-purple-400"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{e.prenom} {e.nom}</h3>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{e.specialite}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                          title="Modifier"
                          onClick={() => openEdit(e)}
                        >
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => setConfirm(e)}
                          className="rounded-lg p-2 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* ── Informations ── */}
                    <div className="space-y-3 mb-4">
                      {/* Email */}
                      <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 truncate flex-1">{e.email}</span>
                        <button
                          onClick={() => copyEmail(e.email, e.id)}
                          className="shrink-0 rounded-md p-1 hover:bg-slate-200 transition-colors"
                          title={isCopied ? "Copié !" : "Copier l'email"}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Disponibilités (calculée par le backend) */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {e.heuresDisponibles != null ? (
                          <span className="text-slate-600">
                            <strong className="text-emit-navy">{e.heuresDisponibles}h</strong> disponibles cette semaine
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Disponibilités non renseignées</span>
                        )}
                      </div>

                      {/* Heures planifiées */}
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600">
                          <strong className="text-emit-navy">{e.heuresPlanifiees ?? 0}h</strong> planifiées dans l'EDT
                        </span>
                      </div>

                      {/* Cours assignés */}
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600">
                          <strong className="text-emit-navy">{e.nbCours}</strong> cours assigné{e.nbCours > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Barre d'occupation */}
                      {taux !== null && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Taux d'occupation</span>
                            <span className={`font-semibold tabular-nums ${isOverloaded ? "text-red-600" : "text-slate-700"}`}>
                              {occupationText(taux)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all ${occupationColor(taux)}`}
                              style={{ width: `${Math.min((taux ?? 0) * 100, 100)}%` }}
                            />
                          </div>
                          {isOverloaded && (
                            <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Surchargé : heures planifiées &gt; heures disponibles
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <Badge tone={statutTone[e.statut]}>
                        {e.statut === "Permanent" ? "Permanent" : e.statut === "Vacataire" ? "Vacataire" : "Invité"}
                      </Badge>
                      <button
                        onClick={() => navigate(`/admin/disponibilites?enseignant=${e.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emit-navy hover:text-emit-sky transition-colors"
                      >
                        <Clock className="h-3 w-3" />
                        Disponibilités
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editTarget ? "Modifier l'enseignant" : "Ajouter un enseignant"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </>
        }
      >
        {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Prénom" placeholder="Herizo" value={form.prenom} onChange={f("prenom")} />
          <Input label="Nom" placeholder="RAKOTO" value={form.nom} onChange={f("nom")} />
          <Input label="Email" type="email" placeholder="prenom@emit.mg" value={form.email} onChange={f("email")} />
          <Input label="Spécialité" placeholder="Génie logiciel" value={form.specialite} onChange={f("specialite")} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
          <select value={form.statut} onChange={f("statut")} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">              <option value="Permanent">Permanent</option>
              <option value="Vacataire">Vacataire</option>
              <option value="Invite">Invité</option>
          </select>
          </div>
        </div>
      </Modal>

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
            Supprimer <strong>{confirm?.prenom} {confirm?.nom}</strong> ? Cette action est irréversible.
          </p>
          {(confirm?.nbCours ?? 0) > 0 && (
            <p className="mt-2 text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Cet enseignant a {confirm?.nbCours} cours assignés. La suppression peut affecter l'EDT.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
