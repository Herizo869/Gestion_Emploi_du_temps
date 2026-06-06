import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";

const typeTone = { CM: "navy", TD: "sky", TP: "green" } as const;

export default function AdminCours() {
  const { cours, enseignants, niveaux } = useData();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cours</h1>
          <p className="text-sm text-slate-500">{cours.length} cours enregistrés</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Ajouter un cours</Button>
      </div>

      <Card>
        <CardBody>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Tous niveaux</option>
              {niveaux.map((n) => <option key={n.id}>{n.libelle}</option>)}
            </select>
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Toutes filières</option>
              <option>INFO</option><option>RESEAUX</option><option>GL</option>
            </select>
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
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
                </tr>
              </thead>
              <tbody>
                {cours.map((c) => {
                  const pct = (c.heuresPlanifiees / c.volumeHoraire) * 100;
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
                      <td className="py-3 pr-3">{c.niveau}</td>
                      <td className="py-3 pr-3">{c.filiere}</td>
                      <td className="py-3 pr-3 tabular-nums">{c.enseignantIds.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un cours"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => setOpen(false)}>Enregistrer</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Intitulé" placeholder="Algorithmique" />
          <Input label="Volume horaire (h)" type="number" placeholder="24" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>CM</option><option>TD</option><option>TP</option></select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Niveau</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{niveaux.map((n) => <option key={n.id}>{n.libelle}</option>)}</select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Filière</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>INFO</option><option>RESEAUX</option><option>GL</option></select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Enseignants qualifiés</label>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {enseignants.map((e) => (
                <label key={e.id} className="flex items-center gap-2 rounded p-1 text-sm hover:bg-slate-50">
                  <input type="checkbox" /> {e.prenom} {e.nom} <span className="text-xs text-slate-500">— {e.specialite}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
