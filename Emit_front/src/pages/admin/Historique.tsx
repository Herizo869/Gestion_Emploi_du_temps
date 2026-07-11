import { useMemo, useState } from "react";
import { Download, Search, Filter } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";
import type { LogEntry } from "@/types";

const tone = {
  Ajout: "green" as const, Modification: "blue" as const, Suppression: "red" as const,
  Generation: "purple" as const, Publication: "navy" as const, Annulation: "orange" as const,
};

export default function AdminHistorique() {
  const { journal } = useData();
  const [filterDate, setFilterDate] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  // Actions uniques pour le filtre
  const actionsUniques = useMemo(
    () => [...new Set(journal.map(j => j.action))],
    [journal]
  );
  // Utilisateurs uniques pour le filtre
  const usersUniques = useMemo(
    () => [...new Set(journal.map(j => j.utilisateur))],
    [journal]
  );

  // Filtrage
  const filtered = useMemo(() => {
    let result = journal;
    if (filterDate) {
      result = result.filter(j => j.date.startsWith(filterDate));
    }
    if (filterAction) {
      result = result.filter(j => j.action === filterAction);
    }
    if (filterUser) {
      result = result.filter(j => j.utilisateur === filterUser);
    }
    return result;
  }, [journal, filterDate, filterAction, filterUser]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const exportCsv = () => {
    const header = "Date;Utilisateur;Action;Entite;Ancien;Nouveau\n";
    const rows = filtered.map(j =>
      `"${j.date}";"${j.utilisateur}";"${j.action}";"${j.entite}";"${j.ancien ?? ""}";"${j.nouveau ?? ""}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique & journal</h1>
          <p className="text-sm text-slate-500">{filtered.length} entrée{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv}>
          Exporter CSV
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Filtres actifs */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={e => { setFilterDate(e.target.value); setPage(0); }}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-emit-blue focus:outline-none focus:ring-1 focus:ring-emit-blue"
              />
              {filterDate && (
                <button
                  onClick={() => { setFilterDate(""); setPage(0); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={filterAction}
              onChange={e => { setFilterAction(e.target.value); setPage(0); }}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Toutes actions</option>
              {actionsUniques.map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              value={filterUser}
              onChange={e => { setFilterUser(e.target.value); setPage(0); }}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Tous utilisateurs</option>
              {usersUniques.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          {/* Tableau */}
          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search className="h-10 w-10 mb-3" />
              {filterDate || filterAction || filterUser ? (
                <>
                  <p className="text-sm">Aucune entrée ne correspond à vos filtres</p>
                  <button
                    onClick={() => { setFilterDate(""); setFilterAction(""); setFilterUser(""); }}
                    className="mt-2 text-xs font-medium text-emit-sky hover:text-emit-navy"
                  >
                    Réinitialiser les filtres
                  </button>
                </>
              ) : (
                <p className="text-sm">Aucune entrée dans le journal</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="py-2.5 pr-3">Date / heure</th>
                    <th className="py-2.5 pr-3">Utilisateur</th>
                    <th className="py-2.5 pr-3">Action</th>
                    <th className="py-2.5 pr-3">Entité</th>
                    <th className="py-2.5 pr-3">Ancien → Nouveau</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-3 font-mono text-xs text-slate-600">{l.date}</td>
                      <td className="py-3 pr-3 text-slate-700">{l.utilisateur}</td>
                      <td className="py-3 pr-3">
                        <Badge tone={tone[l.action]}>{l.action}</Badge>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">{l.entite}</td>
                      <td className="py-3 pr-3 text-xs text-slate-500">
                        {l.ancien && l.nouveau ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="line-through text-red-500">{l.ancien}</span>
                            <span className="text-slate-300">→</span>
                            <span className="text-green-600">{l.nouveau}</span>
                          </span>
                        ) : l.ancien ? (
                          <span className="line-through text-red-500">{l.ancien}</span>
                        ) : l.nouveau ? (
                          <span className="text-green-600">{l.nouveau}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PER_PAGE && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {(page * PER_PAGE) + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} sur {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline" size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
