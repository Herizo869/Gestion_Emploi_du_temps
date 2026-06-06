import { useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, Upload } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import WeeklyGrid from "@/components/WeeklyGrid";
import Modal from "@/components/ui/Modal";
import { useData } from "@/context/DataContext";
import type { SlotEDT } from "@/types";

export default function AdminEdt() {
  const { edt: edtL3Info, niveaux, salles, enseignants } = useData();
  const [selected, setSelected] = useState<SlotEDT | null>(null);
  const [conflict, setConflict] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Modification de l'EDT</h1>
        <Button leftIcon={<Upload className="h-4 w-4" />}>Publier</Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
              {niveaux.map(n => <option key={n.id}>{n.libelle}</option>)}
            </select>
            <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
              <option>INFO</option><option>RESEAUX</option><option>GL</option>
            </select>
            <div className="ml-auto flex items-center gap-2">
              <button className="rounded p-1.5 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-sm font-medium">Semaine du 12 mai 2025</span>
              <button className="rounded p-1.5 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <WeeklyGrid slots={edtL3Info} onClickSlot={setSelected} />
        </CardBody>
      </Card>

      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setConflict(false); }}
        title={`Modifier — ${selected?.intitule}`}
        footer={
          <>
            <Button variant="outline" onClick={() => { setSelected(null); setConflict(false); }}>Annuler</Button>
            <Button disabled={conflict} onClick={() => { setSelected(null); setConflict(false); }}>Enregistrer</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Créneau</label>
                <input defaultValue={`${selected.jour} ${selected.debut}-${selected.fin}`} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Salle</label>
                <select defaultValue={selected.salle} onChange={() => setConflict(true)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  {salles.map(s => <option key={s.id}>{s.numero}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Enseignant</label>
                <select defaultValue={selected.enseignant} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  {enseignants.map(e => <option key={e.id}>{e.prenom[0]}. {e.nom}</option>)}
                </select>
              </div>
            </div>

            {conflict && (
              <>
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div className="text-xs">
                    <p className="font-semibold">Conflit détecté</p>
                    <p>Cette salle est déjà occupée à ce créneau.</p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-1 text-xs font-semibold text-slate-500">Suggestions alternatives</p>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• Salle A102 — libre à ce créneau</li>
                    <li>• Salle B202 — libre à ce créneau</li>
                    <li>• Déplacer en Mardi 11h00 — AMPHI-1 libre</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
