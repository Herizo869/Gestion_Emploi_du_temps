import { useState } from "react";
import { Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useData } from "@/context/DataContext";
import { apiCreateSalle, apiUpdateSalle, apiDeleteSalle } from "@/lib/api";
import type { Salle } from "@/types";

const typeTone = { 
  Cours: "blue", 
  TP: "green", 
  Amphi: "purple", 
  Examen: "orange", 
  Reunion: "gray" 
} as const;

const emptyForm: Omit<Salle, "id"> = { 
  numero: "", 
  batiment: "", 
  capacite: 40, 
  type: "Cours", 
  disponible: true, 
  occupation: 0 
};

export default function AdminSalles() {
  const { salles: items, refresh } = useData();

  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Salle | null>(null);
  const [confirm, setConfirm] = useState<Salle | null>(null);
  const [form, setForm] = useState<Omit<Salle, "id">>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold text-slate-900">Salles</h1>
          <p className="text-sm text-slate-500">{items.length} salles configurées</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Ajouter une salle
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Numéro</th>
                  <th className="py-2.5 pr-3">Bâtiment</th>
                  <th className="py-2.5 pr-3">Capacité</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Disponible</th>
                  <th className="py-2.5 pr-3">Occupation</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Aucune salle configurée</td>
                  </tr>
                )}
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-3 font-medium">{s.numero}</td>
                    <td className="py-3 pr-3 text-slate-600">{s.batiment}</td>
                    <td className="py-3 pr-3 tabular-nums">{s.capacite}</td>
                    <td className="py-3 pr-3">
                      <Badge tone={typeTone[s.type]}>{s.type}</Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <button 
                        onClick={() => toggleDispo(s)}
                        className="inline-flex items-center focus:outline-none"
                      >
                        <span className={`relative inline-block h-5 w-9 rounded-full transition ${s.disponible ? "bg-green-500" : "bg-slate-300"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${s.disponible ? "left-4" : "left-0.5"}`} />
                        </span>
                      </button>
                    </td>
                    <td className="py-3 pr-3 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className={`h-full ${s.occupation > 90 ? "bg-red-500" : "bg-emit-blue"}`} 
                            style={{ width: `${s.occupation}%` }} 
                          />
                        </div>
                        <span className="text-xs tabular-nums text-slate-500">{s.occupation}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button 
                          onClick={() => openEdit(s)}
                          className="rounded p-1.5 hover:bg-slate-200"
                        >
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </button>
                        <button 
                          onClick={() => setConfirm(s)}
                          className="rounded p-1.5 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
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
          <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
          <p className="text-sm text-slate-700">
            Supprimer la salle <strong>{confirm?.numero}</strong> ?<br />
            Cette action est irréversible.
          </p>
        </div>
      </Modal>
    </div>
  );
}