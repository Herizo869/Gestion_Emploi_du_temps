import { useState } from "react";
import { Bell, CheckCheck, Calendar, BookOpen, Settings as SettingsIcon, AlertTriangle, Clock, MapPin } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useData } from "@/context/DataContext";

const NOTIF_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  planning: { icon: <Calendar className="h-4 w-4" />, bg: "bg-red-100", text: "text-red-700" },
  cours:    { icon: <BookOpen className="h-4 w-4" />, bg: "bg-blue-100", text: "text-blue-700" },
  systeme:  { icon: <SettingsIcon className="h-4 w-4" />, bg: "bg-green-100", text: "text-green-700" },
  salle:    { icon: <MapPin className="h-4 w-4" />, bg: "bg-purple-100", text: "text-purple-700" },
  conflit:  { icon: <AlertTriangle className="h-4 w-4" />, bg: "bg-orange-100", text: "text-orange-700" },
  edt:      { icon: <Clock className="h-4 w-4" />, bg: "bg-cyan-100", text: "text-cyan-700" },
};

const getConfig = (type: string) =>
  NOTIF_CONFIG[type] ?? { icon: <Bell className="h-4 w-4" />, bg: "bg-slate-100", text: "text-slate-700" };

export default function EnsNotifications() {
  const { notifications: list, setNotifications: setList } = useData();
  const [filter, setFilter] = useState<string>("");

  const shown = filter ? list.filter(n => n.type === filter) : list;

  const markAll = () => setList(list.map(n => ({ ...n, lu: true })));
  const markOne = (id: string) => setList(list.map(n => (n.id === id ? { ...n, lu: true } : n)));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Mes notifications</h1>
        <Button variant="outline" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAll}>
          Tout marquer comme lu
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["", "planning", "cours", "salle", "conflit", "edt", "systeme"] as const).map(t => (
          <button
            key={t || "all"}
            onClick={() => setFilter(t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              filter === t ? "bg-emit-navy text-white border-emit-navy shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emit-sky"
            }`}
          >
            {t === "" ? "Toutes" : t === "planning" ? "Planning" : t === "cours" ? "Cours" : t === "salle" ? "Salles" : t === "conflit" ? "Conflits" : t === "edt" ? "EDT" : "Système"}
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
          {shown.map(n => {
            const cfg = getConfig(n.type);
            return (
              <button
                key={n.id}
                onClick={() => markOne(n.id)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                  !n.lu ? "border-emit-sky/40 bg-emit-light/40 ring-1 ring-emit-sky/10" : "border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cfg.bg} ${cfg.text} shadow-sm`}>
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{n.titre}</p>
                    {!n.lu && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.description}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </button>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
