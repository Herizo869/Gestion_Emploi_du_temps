import { Undo2, Download } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { journal } from "@/data/mock";

const tone = {
  Ajout: "green", Modification: "blue", Suppression: "red",
  Generation: "purple", Publication: "navy", Annulation: "orange",
} as const;

export default function AdminHistorique() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Historique & journal</h1>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Exporter CSV</Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="date" className="h-11 rounded-lg border border-slate-300 px-3 text-sm" />
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Toutes actions</option>
              {Object.keys(tone).map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value="">Tous utilisateurs</option>
              <option>Admin</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Date / heure</th>
                  <th className="py-2.5 pr-3">Utilisateur</th>
                  <th className="py-2.5 pr-3">Action</th>
                  <th className="py-2.5 pr-3">Entité</th>
                  <th className="py-2.5 pr-3">Ancien → Nouveau</th>
                  <th className="py-2.5 text-right">Annuler</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-3 font-mono text-xs text-slate-600">{l.date}</td>
                    <td className="py-3 pr-3">{l.utilisateur}</td>
                    <td className="py-3 pr-3"><Badge tone={tone[l.action]}>{l.action}</Badge></td>
                    <td className="py-3 pr-3 text-slate-700">{l.entite}</td>
                    <td className="py-3 pr-3 text-xs text-slate-500">
                      {l.ancien && l.nouveau ? `${l.ancien} → ${l.nouveau}` : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" leftIcon={<Undo2 className="h-3.5 w-3.5" />}>Undo</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>50 entrées par page</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm">Précédent</Button>
              <Button variant="outline" size="sm">Suivant</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
