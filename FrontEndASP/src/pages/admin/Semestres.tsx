import { Copy, Archive } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { semestres, CRENEAUX, JOURS } from "@/data/mock";

const statutTone = { brouillon: "orange", publie: "green", archive: "gray" } as const;

export default function AdminSemestres() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Semestres</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        {semestres.map((s) => (
          <Card key={s.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.libelle}</p>
                  <p className="text-xs text-slate-500">{s.annee}</p>
                </div>
                <Badge tone={statutTone[s.statut]}>{s.statut}</Badge>
              </div>
              {s.datePublication && (
                <p className="mt-3 text-xs text-slate-500">Publié le {s.datePublication}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />}>Dupliquer</Button>
                {s.statut === "publie" && (
                  <Button variant="outline" size="sm" leftIcon={<Archive className="h-3.5 w-3.5" />}>Archiver</Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Créer un semestre" subtitle="Configuration des créneaux" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Nom" placeholder="Semestre 2" />
            <Input label="Année académique" placeholder="2024-2025" />
            <Input label="Durée d'un créneau (min)" type="number" defaultValue={90} />
            <Input label="Heure de début" type="time" defaultValue="07:30" />
            <Input label="Heure de fin" type="time" defaultValue="18:30" />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Jours ouvrés</p>
            <div className="flex flex-wrap gap-2">
              {JOURS.map((j) => (
                <label key={j} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm">
                  <input type="checkbox" defaultChecked /> {j}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button>Créer le semestre</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Créneaux générés" subtitle="Modifiable individuellement" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Jour</th>
                  <th className="py-2 pr-3">Créneau</th>
                </tr>
              </thead>
              <tbody>
                {JOURS.flatMap((j) =>
                  CRENEAUX.map((c) => (
                    <tr key={j + c} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-medium">{j}</td>
                      <td className="py-2 pr-3 font-mono text-slate-600">{c}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
