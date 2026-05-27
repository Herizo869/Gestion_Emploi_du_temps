import { useState } from "react";
import { Plus, Edit2, Trash2, ChevronDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { niveaux } from "@/data/mock";

export default function AdminNiveaux() {
  const [openN, setOpenN] = useState(false);
  const [openF, setOpenF] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Niveaux & Filières</h1>
          <p className="text-sm text-slate-500">Hiérarchie académique</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenF(true)}>Ajouter filière</Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenN(true)}>Ajouter niveau</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {niveaux.map((n) => (
          <Card key={n.id}>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge tone="navy">{n.libelle}</Badge>
                  <span className="text-sm text-slate-500">Effectif max : <strong>{n.effectifMax}</strong></span>
                </div>
                <div className="flex gap-1">
                  <button className="rounded p-1.5 hover:bg-slate-100"><Edit2 className="h-4 w-4 text-slate-500" /></button>
                  <button className="rounded p-1.5 hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-600" /></button>
                </div>
              </div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <ChevronDown className="h-3 w-3" /> Filières ({n.filieres.length})
              </div>
              <ul className="space-y-2">
                {n.filieres.map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{f.libelle}</p>
                      <p className="text-xs text-slate-500">{f.description} — {f.nbCours} cours</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="rounded p-1.5 hover:bg-white"><Edit2 className="h-4 w-4 text-slate-500" /></button>
                      <button className="rounded p-1.5 hover:bg-red-100"><Trash2 className="h-4 w-4 text-red-600" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={openN} onClose={() => setOpenN(false)} title="Ajouter un niveau"
        footer={<><Button variant="outline" onClick={() => setOpenN(false)}>Annuler</Button><Button onClick={() => setOpenN(false)}>Enregistrer</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Libellé</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>L1</option><option>L2</option><option>L3</option><option>M1</option><option>M2</option></select>
          </div>
          <Input label="Effectif maximum" type="number" placeholder="100" />
        </div>
      </Modal>

      <Modal open={openF} onClose={() => setOpenF(false)} title="Ajouter une filière"
        footer={<><Button variant="outline" onClick={() => setOpenF(false)}>Annuler</Button><Button onClick={() => setOpenF(false)}>Enregistrer</Button></>}>
        <div className="grid gap-3">
          <Input label="Libellé" placeholder="INFO" />
          <Input label="Description" placeholder="Informatique" />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Niveau parent</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{niveaux.map(n => <option key={n.id}>{n.libelle}</option>)}</select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
