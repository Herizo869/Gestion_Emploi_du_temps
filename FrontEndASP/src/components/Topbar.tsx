import { Bell, ChevronDown, Home } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { notifications } from "@/data/mock";

const LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  enseignants: "Enseignants",
  salles: "Salles",
  cours: "Cours",
  niveaux: "Niveaux & Filières",
  semestres: "Semestres",
  disponibilites: "Disponibilités",
  generer: "Générer EDT",
  edt: "Voir l'EDT",
  export: "Export & publication",
  historique: "Historique",
  profil: "Mon profil",
  notifications: "Notifications",
  admin: "Admin",
  enseignant: "Enseignant",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const parts = pathname.split("/").filter(Boolean);
  const unread = notifications.filter((n) => !n.lu).length;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur">
      <nav className="flex items-center gap-1.5 text-sm">
        <Home className="h-4 w-4 text-slate-400" />
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-slate-400">/</span>
            <span className={i === parts.length - 1 ? "font-medium text-slate-800" : "text-slate-500"}>
              {LABELS[p] ?? p}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"
          >
            <Bell className="h-4 w-4 text-slate-600" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
              <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                Notifications
              </p>
              <ul className="max-h-72 overflow-y-auto">
                {notifications.slice(0, 3).map((n) => (
                  <li
                    key={n.id}
                    className={`border-b border-slate-50 px-4 py-3 text-sm last:border-0 ${
                      !n.lu ? "bg-emit-light/40" : ""
                    }`}
                  >
                    <p className="font-medium text-slate-800">{n.titre}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{n.description}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{n.date}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 hover:bg-slate-200">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emit-navy text-[11px] font-bold text-white">
            {`${user?.prenom[0] ?? ""}${user?.nom[0] ?? ""}`.toUpperCase()}
          </span>
          <span className="text-sm font-medium text-slate-700">{user?.prenom}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
