import { useState } from "react";
import { Bell, CheckCheck, Calendar, BookOpen, Settings as SettingsIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { notifications as initial } from "@/data/mock";

const iconFor = (t: string) =>
  t === "planning" ? <Calendar className="h-4 w-4" /> : t === "cours" ? <BookOpen className="h-4 w-4" /> : <SettingsIcon className="h-4 w-4" />;

const colorFor = (t: string) =>
  t === "planning" ? "bg-red-100 text-red-700" : t === "cours" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";

export default function EnsNotifications() {
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState<"" | "planning" | "cours" | "systeme">("");

  const shown = filter ? list.filter(n => n.type === filter) : list;

  const markAll = () => setList(arr => arr.map(n => ({ ...n, lu: true })));
  const markOne = (id: string) => setList(arr => arr.map(n => (n.id === id ? { ...n, lu: true } : n)));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Mes notifications</h1>
        <Button variant="outline" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAll}>
          Tout marquer comme lu
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["", "planning", "cours", "systeme"] as const).map(t => (
          <button
            key={t || "all"}
            onClick={() => setFilter(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              filter === t ? "bg-emit-navy text-white border-emit-navy" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "" ? "Toutes" : t === "planning" ? "Planning" : t === "cours" ? "Cours" : "Système"}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-2">
          {shown.length === 0 && (
            <div className="grid place-items-center py-10 text-slate-400">
              <Bell className="h-8 w-8" /><p className="mt-2 text-sm">Aucune notification</p>
            </div>
          )}
          {shown.map(n => (
            <button
              key={n.id}
              onClick={() => markOne(n.id)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                !n.lu ? "border-emit-sky/40 bg-emit-light/40" : "border-slate-100 bg-white hover:bg-slate-50"
              }`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${colorFor(n.type)}`}>
                {iconFor(n.type)}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{n.titre}</p>
                  {!n.lu && <span className="h-2 w-2 rounded-full bg-red-500" />}
                </div>
                <p className="text-xs text-slate-600">{n.description}</p>
                <p className="mt-1 text-[10px] text-slate-400">{n.date}</p>
              </div>
            </button>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
