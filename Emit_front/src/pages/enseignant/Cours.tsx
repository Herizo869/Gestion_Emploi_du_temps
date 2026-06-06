import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";

const typeTone = { CM: "navy", TD: "sky", TP: "green" } as const;

export default function EnsCours() {
  const { cours } = useData();
  const { user } = useAuth();
  const mine = cours.filter(c => c.enseignantIds.includes(user?.id ?? ""));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Mes cours assignés</h1>
      <Card>
        <CardBody className="space-y-4">
          <select className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm sm:max-w-xs">
            <option value="">Tous types</option>
            <option>CM</option><option>TD</option><option>TP</option>
          </select>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Intitulé</th>
                  <th className="py-2.5 pr-3">Niveau</th>
                  <th className="py-2.5 pr-3">Filière</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Volume</th>
                  <th className="py-2.5 pr-3">Avancement</th>
                  <th className="py-2.5 pr-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {mine.map(c => {
                  const pct = (c.heuresPlanifiees / c.volumeHoraire) * 100;
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <td className="py-3 pr-3 font-medium">{c.intitule}</td>
                      <td className="py-3 pr-3">{c.niveau}</td>
                      <td className="py-3 pr-3">{c.filiere}</td>
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
                      <td className="py-3 pr-3">
                        {pct === 100 ? <Badge tone="green">Complet</Badge> : pct === 0 ? <Badge tone="red">À planifier</Badge> : <Badge tone="orange">En cours</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
