import { Users, Building2, CalendarCheck, AlertTriangle, Plus, Download, Zap } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { conflits, salles, statutNiveaux, journal } from "@/data/mock";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500">
            Semestre actif :{" "}
            <span className="font-medium text-slate-700">Semestre 1 — 2024-2025</span>{" "}
            <Badge tone="green">Publié</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Exporter</Button>
          <Button leftIcon={<Zap className="h-4 w-4" />}>Générer EDT</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enseignants" value={24} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Salles" value={18} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Cours planifiés" value={67} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard label="Conflits actifs" value={2} tone="red" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Alertes conflits" subtitle="Non résolus" />
          <CardBody>
            <ul className="space-y-3">
              {conflits.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Conflit {c.type}
                    </p>
                    <p className="text-xs text-red-700">{c.description}</p>
                    <p className="mt-1 text-[10px] text-slate-500">{c.date}</p>
                  </div>
                  <Button variant="outline" size="sm">Résoudre</Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Statut par niveau" subtitle="État de publication de l'EDT" />
          <CardBody>
            <table className="w-full text-sm">
              <tbody>
                {statutNiveaux.map((r) => (
                  <tr key={r.niveau} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 font-medium">{r.niveau}</td>
                    <td className="py-2.5 text-right">
                      {r.statut === "Publié" && <Badge tone="green">Publié</Badge>}
                      {r.statut === "Brouillon" && <Badge tone="orange">Brouillon</Badge>}
                      {r.statut === "Non démarré" && <Badge tone="gray">Non démarré</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Actions rapides" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button leftIcon={<Zap className="h-4 w-4" />}>Générer EDT</Button>
            <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />}>Ajouter enseignant</Button>
            <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />}>Ajouter salle</Button>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Exporter PDF</Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Occupation des salles" />
          <CardBody className="space-y-3">
            {salles.slice(0, 5).map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{s.numero}</span>
                  <span className={s.occupation > 90 ? "font-semibold text-red-600" : "text-slate-500"}>
                    {s.occupation}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${s.occupation > 90 ? "bg-red-500" : "bg-emit-blue"}`}
                    style={{ width: `${s.occupation}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Activité récente" />
          <CardBody>
            <ul className="space-y-3">
              {journal.slice(0, 4).map((j) => (
                <li key={j.id} className="flex items-start gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emit-light text-xs text-emit-navy">
                    {j.action[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{j.action}</span> — {j.entite}
                    </p>
                    <p className="text-[11px] text-slate-400">{j.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
