import { Download, FileText, FileSpreadsheet, Link2, Upload } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WeeklyGrid from "@/components/WeeklyGrid";
import { edtL3Info, niveaux } from "@/data/mock";

export default function AdminExport() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Export & publication</h1>

      <Card>
        <CardHeader title="Filtres d'export" />
        <CardBody className="grid gap-3 sm:grid-cols-4">
          <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">Tous niveaux</option>
            {niveaux.map(n => <option key={n.id}>{n.libelle}</option>)}
          </select>
          <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">Tous enseignants</option>
          </select>
          <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">Toutes salles</option>
          </select>
          <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm">
            <option>Semaine en cours</option><option>Semestre entier</option>
          </select>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Aperçu avant export" subtitle="L3 INFO — Semaine du 12 mai 2025" />
        <CardBody><WeeklyGrid slots={edtL3Info} /></CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody className="space-y-3">
            <FileText className="h-7 w-7 text-emit-navy" />
            <div>
              <h3 className="text-sm font-semibold">PDF A4 Portrait</h3>
              <p className="text-xs text-slate-500">Compact — idéal affichage mural</p>
            </div>
            <Button fullWidth leftIcon={<Download className="h-4 w-4" />}>Télécharger</Button>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <FileText className="h-7 w-7 text-emit-blue" />
            <div>
              <h3 className="text-sm font-semibold">PDF A4 Paysage</h3>
              <p className="text-xs text-slate-500">Planning détaillé</p>
            </div>
            <Button fullWidth leftIcon={<Download className="h-4 w-4" />}>Télécharger</Button>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <FileSpreadsheet className="h-7 w-7 text-green-600" />
            <div>
              <h3 className="text-sm font-semibold">CSV / Excel</h3>
              <p className="text-xs text-slate-500">Données brutes</p>
            </div>
            <Button fullWidth variant="secondary" leftIcon={<Download className="h-4 w-4" />}>Télécharger</Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Lien public partageable" />
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Link2 className="h-4 w-4 text-slate-500" />
            <code className="flex-1 truncate text-xs text-slate-700">
              https://emit.mg/edt?niveau=L3&filiere=INFO&semaine=19
            </code>
            <Button size="sm" variant="outline">Copier</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Statut de publication" />
        <CardBody className="flex items-center justify-between">
          <div className="space-y-1">
            <Badge tone="green">Publié</Badge>
            <p className="text-xs text-slate-500">Dernière publication : 15 mai 2025 à 14:32</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Dépublier</Button>
            <Button leftIcon={<Upload className="h-4 w-4" />}>Publier</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
