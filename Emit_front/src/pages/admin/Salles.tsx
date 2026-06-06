import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useData } from "@/context/DataContext";

const typeTone = {
  Cours: "blue", TP: "green", Amphi: "purple", Examen: "orange", Reunion: "gray",
} as const;

export default function AdminSalles() {
  const { salles: items, setSalles: setItems } = useData();
  const [open, setOpen] = useState(false);

  const toggle = (id: string) =>
    setItems(items.map((s) => (s.id === id ? { ...s, disponible: !s.disponible } : s)));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salles</h1>
          <p className="text-sm text-slate-500">{items.length} salles configurées</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Ajouter</Button>
      </div>

      <Card>
        <CardBody>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Tous types</option>
              <option>Cours</option><option>TP</option><option>Amphi</option><option>Examen</option><option>Reunion</option>
            </select>
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Tous bâtiments</option>
              <option>A</option><option>B</option><option>C</option>
            </select>
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Toute disponibilité</option>
              <option>Disponible</option><option>Indisponible</option>
            </select>
          </div>

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
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-3 font-medium">{s.numero}</td>
                    <td className="py-3 pr-3 text-slate-600">{s.batiment}</td>
                    <td className="py-3 pr-3 tabular-nums">{s.capacite}</td>
                    <td className="py-3 pr-3"><Badge tone={typeTone[s.type]}>{s.type}</Badge></td>
                    <td className="py-3 pr-3">
                      <button onClick={() => toggle(s.id)} className="inline-flex items-center">
                        <span className={`relative inline-block h-5 w-9 rounded-full transition ${s.disponible ? "bg-green-500" : "bg-slate-300"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${s.disponible ? "left-4" : "left-0.5"}`} />
                        </span>
                      </button>
                    </td>
                    <td className="py-3 pr-3 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full ${s.occupation > 90 ? "bg-red-500" : "bg-emit-blue"}`} style={{ width: `${s.occupation}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-slate-500">{s.occupation}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter une salle"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={() => setOpen(false)}>Enregistrer</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Numéro" placeholder="A103" />
          <Input label="Bâtiment" placeholder="A" />
          <Input label="Capacité" type="number" placeholder="40" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option>Cours</option><option>TP</option><option>Amphi</option><option>Examen</option><option>Reunion</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Disponible</label>
        </div>
      </Modal>
    </div>
  );
}
