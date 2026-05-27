import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, BookOpen, GraduationCap,
  CalendarRange, Zap, CalendarDays, History, User, Settings,
  Calendar, Bell, KeyRound, LogOut, ListChecks,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/context/AuthContext";

interface Item { to: string; label: string; icon: any; badge?: number }
interface Section { title: string; items: Item[] }

const ADMIN: Section[] = [
  {
    title: "NAVIGATION",
    items: [
      { to: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/admin/enseignants", label: "Enseignants", icon: Users },
      { to: "/admin/salles", label: "Salles", icon: Building2 },
      { to: "/admin/cours", label: "Cours", icon: BookOpen },
      { to: "/admin/niveaux", label: "Niveaux & Filières", icon: GraduationCap },
    ],
  },
  {
    title: "PLANNING",
    items: [
      { to: "/admin/semestres", label: "Semestres", icon: CalendarRange },
      { to: "/admin/disponibilites", label: "Disponibilités", icon: ListChecks },
      { to: "/admin/generer", label: "Générer EDT", icon: Zap },
      { to: "/admin/edt", label: "Voir l'EDT", icon: CalendarDays },
      { to: "/admin/export", label: "Export & publication", icon: CalendarDays },
      { to: "/admin/historique", label: "Historique", icon: History },
    ],
  },
  {
    title: "COMPTE",
    items: [
      { to: "/admin/dashboard", label: "Mon profil", icon: User },
      { to: "/admin/dashboard", label: "Paramètres", icon: Settings },
    ],
  },
];

const ENSEIGNANT: Section[] = [
  {
    title: "MON ESPACE",
    items: [
      { to: "/enseignant/dashboard", label: "Mon planning", icon: Calendar },
      { to: "/enseignant/cours", label: "Mes cours", icon: BookOpen },
      { to: "/enseignant/disponibilites", label: "Disponibilités", icon: ListChecks },
    ],
  },
  {
    title: "COMPTE",
    items: [
      { to: "/enseignant/profil", label: "Mon profil", icon: User },
      { to: "/enseignant/profil", label: "Mot de passe", icon: KeyRound },
      { to: "/enseignant/notifications", label: "Notifications", icon: Bell, badge: 2 },
    ],
  },
];

export default function Sidebar({ role }: { role: "admin" | "enseignant" }) {
  const sections = role === "admin" ? ADMIN : ENSEIGNANT;
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const initials = `${user?.prenom[0] ?? ""}${user?.nom[0] ?? ""}`.toUpperCase();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {sections.map((sec) => (
          <div key={sec.title} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-bold tracking-widest text-slate-400">
              {sec.title}
            </p>
            <ul className="space-y-0.5">
              {sec.items.map((it) => {
                const Icon = it.icon;
                return (
                  <li key={it.label + it.to}>
                    <NavLink
                      to={it.to}
                      end
                      className={({ isActive }) =>
                        `group flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition ${
                          isActive
                            ? "border-emit-sky bg-emit-light/40 font-semibold text-emit-navy"
                            : "border-transparent text-slate-600 hover:bg-slate-50"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.badge && (
                        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {it.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-emit-navy text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-slate-800">
              {user?.prenom} {user?.nom}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            title="Déconnexion"
            className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
