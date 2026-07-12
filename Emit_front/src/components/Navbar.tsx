import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Users, Building2, BookOpen, GraduationCap,
  CalendarRange, Zap, CalendarDays, History, User, Settings,
  Calendar, Bell, KeyRound, LogOut, ListChecks, ChevronDown, Menu, X,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

interface Item { to: string; label: string; icon: any; badge?: number }
interface Group { title: string; icon: any; items: Item[] }

const ADMIN: Group[] = [
  {
    title: "Gestion",
    icon: LayoutDashboard,
    items: [
      { to: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/admin/enseignants", label: "Enseignants", icon: Users },
      { to: "/admin/salles", label: "Salles", icon: Building2 },
      { to: "/admin/cours", label: "Cours", icon: BookOpen },
      { to: "/admin/niveaux", label: "Niveaux & Filières", icon: GraduationCap },
    ],
  },
  {
    title: "Planning",
    icon: CalendarDays,
    items: [
      { to: "/admin/semestres", label: "Semestres", icon: CalendarRange },
      { to: "/admin/disponibilites", label: "Disponibilités", icon: ListChecks },
      { to: "/admin/generer", label: "Générer EDT", icon: Zap },
      { to: "/admin/edt", label: "Voir l'EDT", icon: CalendarDays },
      { to: "/admin/export", label: "Export & publication", icon: CalendarDays },
      { to: "/admin/historique", label: "Historique", icon: History },
    ],
  },
];

const ENSEIGNANT: Group[] = [
  {
    title: "Mon espace",
    icon: Calendar,
    items: [
      { to: "/enseignant/dashboard", label: "Mon planning", icon: Calendar },
      { to: "/enseignant/cours", label: "Mes cours", icon: BookOpen },
      { to: "/enseignant/disponibilites", label: "Disponibilités", icon: ListChecks },
    ],
  },
];

export default function Navbar({ role }: { role: "admin" | "enseignant" }) {
  const groups = role === "admin" ? ADMIN : ENSEIGNANT;
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications } = useData();

  const nameParts = (user?.full_name ?? user?.email ?? "?").split(" ");
  const initials = (nameParts.length >= 2
    ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
    : (user?.full_name ?? user?.email ?? "?")[0]
  ).toUpperCase();
  const unread = notifications.filter((n) => !n.lu).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setOpenUser(false);
        setOpenNotif(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  const isActiveGroup = (g: Group) => g.items.some((i) => pathname === i.to);

  const profileLink = role === "admin" ? "/admin/dashboard" : "/enseignant/profil";
  const notifLink = role === "enseignant" ? "/enseignant/notifications" : undefined;

  return (
    <header
      ref={ref}
      className="sticky top-0 z-30 border-b border-emit-navy/10 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 md:px-6">
        <NavLink to={role === "admin" ? "/admin/dashboard" : "/enseignant/dashboard"} className="shrink-0">
          <Logo />
        </NavLink>

        {/* Desktop nav */}
        <nav className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {groups.map((g) => {
            const Icon = g.icon;
            const active = isActiveGroup(g);
            const open = openGroup === g.title;
            return (
              <div key={g.title} className="relative">
                <button
                  onClick={() => setOpenGroup(open ? null : g.title)}
                  className={`group flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-emit-navy text-white shadow-sm"
                      : "text-emit-navy/80 hover:bg-emit-sky/15 hover:text-emit-navy"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {g.title}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="absolute left-0 mt-2 w-64 origin-top-left animate-[fadeIn_.15s_ease-out] overflow-hidden rounded-xl border border-emit-navy/10 bg-white shadow-xl ring-1 ring-emit-sky/20">
                    <ul className="p-1.5">
                      {g.items.map((it) => {
                        const II = it.icon;
                        return (
                          <li key={it.label + it.to}>
                            <NavLink
                              to={it.to}
                              end
                              className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                  isActive
                                    ? "bg-emit-sky/20 font-semibold text-emit-navy"
                                    : "text-slate-700 hover:bg-emit-sky/10 hover:text-emit-navy"
                                }`
                              }
                            >
                              <II className="h-4 w-4 text-emit-sky" />
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
                )}
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                if (notifLink) nav(notifLink);
                else setOpenNotif(!openNotif);
              }}
              className="relative grid h-10 w-10 place-items-center rounded-full text-emit-navy transition-colors hover:bg-emit-sky/15"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                  {unread}
                </span>
              )}
            </button>
            {openNotif && !notifLink && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-emit-navy/10 bg-white shadow-xl">
                <p className="border-b border-slate-100 bg-emit-navy px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">
                  Notifications
                </p>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 5).map((n) => (
                    <li
                      key={n.id}
                      className={`border-b border-slate-50 px-4 py-3 text-sm last:border-0 ${
                        !n.lu ? "bg-emit-sky/10" : ""
                      }`}
                    >
                      <p className="font-medium text-emit-navy">{n.titre}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{n.description}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{n.date}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setOpenUser(!openUser)}
              className="flex items-center gap-2.5 rounded-full border border-emit-navy/10 bg-white py-1 pl-1 pr-3 transition-all hover:border-emit-sky hover:shadow-sm"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emit-navy to-emit-sky text-[11px] font-bold text-white">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-emit-navy sm:inline">
                {user?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0]}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${openUser ? "rotate-180" : ""}`} />
            </button>
            {openUser && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-emit-navy/10 bg-white shadow-xl">
                <div className="bg-gradient-to-br from-emit-navy to-emit-navy-dark px-4 py-3 text-white">
                  <p className="text-sm font-semibold">{user?.full_name ?? user?.email?.split("@")[0]}</p>
                  <p className="truncate text-xs text-emit-sky">{user?.email}</p>
                </div>
                <ul className="p-1.5">
                  <li>
                    <button
                      onClick={() => { setOpenUser(false); nav(profileLink); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-emit-sky/10 hover:text-emit-navy"
                    >
                      <User className="h-4 w-4 text-emit-sky" /> Mon profil
                    </button>
                  </li>
                  {role === "enseignant" && (
                    <li>
                      <button
                        onClick={() => { setOpenUser(false); nav("/enseignant/profil"); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-emit-sky/10 hover:text-emit-navy"
                      >
                        <KeyRound className="h-4 w-4 text-emit-sky" /> Mot de passe
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      onClick={() => setOpenUser(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-emit-sky/10 hover:text-emit-navy"
                    >
                      <Settings className="h-4 w-4 text-emit-sky" /> Paramètres
                    </button>
                  </li>
                  <li className="my-1 border-t border-slate-100" />
                  <li>
                    <button
                      onClick={() => { logout(); nav("/login"); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-10 w-10 place-items-center rounded-full text-emit-navy hover:bg-emit-sky/15 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-emit-navy/10 bg-white lg:hidden">
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-4">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-emit-navy/60">
                  {g.title}
                </p>
                <ul className="space-y-0.5">
                  {g.items.map((it) => {
                    const II = it.icon;
                    return (
                      <li key={it.label + it.to}>
                        <NavLink
                          to={it.to}
                          end
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                              isActive
                                ? "bg-emit-navy text-white"
                                : "text-slate-700 hover:bg-emit-sky/15"
                            }`
                          }
                        >
                          <II className="h-4 w-4" />
                          {it.label}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
