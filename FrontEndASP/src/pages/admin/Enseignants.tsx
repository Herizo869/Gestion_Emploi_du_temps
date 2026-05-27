import { useMemo, useState } from "react";
import { Plus, Search, Edit2, Trash2, Eye, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { enseignants as initial } from "@/data/mock";
import type { Enseignant } from "@/types";

const statutTone = { permanent: "green", vacataire: "orange", invite: "purple" } as const;

export default function AdminEnseignants() {
  const [items] = useState<Enseignant[]>(initial);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Enseignant | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (e) =>
          (`${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(q.toLowerCase())) &&
          (!statut || e.statut === statut)
      ),
    [items, q, statut]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enseignants</h1>
          <p className="text-sm text-slate-500">Gestion du corps enseignant ({items.length})</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Ajouter
        </Button>
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
              <option value="permanent">Permanent</option>
              <option value="vacataire">Vacataire</option>
              <option value="invite">Invité</option>
            </select>
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Toutes spécialités</option>
              {[...new Set(items.map((i) => i.specialite))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Enseignant</th>
                  <th className="py-2.5 pr-3">Email</th>
                  <th className="py-2.5 pr-3">Spécialité</th>
                  <th className="py-2.5 pr-3">Statut</th>
                  <th className="py-2.5 pr-3">Cours</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-emit-navy text-xs font-bold text-white">
                          {e.prenom[0]}{e.nom[0]}
                        </div>
                        <span className="font-medium text-slate-800">{e.prenom} {e.nom}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{e.email}</td>
                    <td className="py-3 pr-3 text-slate-600">{e.specialite}</td>
                    <td className="py-3 pr-3"><Badge tone={statutTone[e.statut]}>{e.statut}</Badge></td>
                    <td className="py-3 pr-3 tabular-nums">{e.nbCours}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button className="rounded p-1.5 hover:bg-slate-200" title="Voir"><Eye className="h-4 w-4 text-slate-500" /></button>
                        <button className="rounded p-1.5 hover:bg-slate-200" title="Modifier"><Edit2 className="h-4 w-4 text-slate-500" /></button>
                        <button
                          disabled={e.nbCours > 0}
                          onClick={() => setConfirm(e)}
                          className="rounded p-1.5 hover:bg-red-100 disabled:opacity-30"
                          title="Supprimer"
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

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{filtered.length} résultat(s)</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm">Préc.</Button>
              <Button variant="outline" size="sm">Suiv.</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter un enseignant"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => setOpen(false)}>Enregistrer</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Prénom" placeholder="Herizo" />
          <Input label="Nom" placeholder="RAKOTO" />
          <Input label="Email" type="email" placeholder="prenom@emit.mg" />
          <Input label="Spécialité" placeholder="Génie logiciel" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option>permanent</option><option>vacataire</option><option>invite</option>
            </select>
          </div>
          <Input label="Mot de passe initial" type="text" placeholder="********" />
        </div>
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => setConfirm(null)}>Supprimer</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
          <p className="text-sm text-slate-700">
            Supprimer <strong>{confirm?.prenom} {confirm?.nom}</strong> ? Cette action est irréversible.
          </p>
        </div>
      </Modal>
    </div>
  );
}
