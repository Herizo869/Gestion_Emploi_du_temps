import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download, User, BookOpen, Clock, GraduationCap, Bell, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/StatCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WeeklyGrid from "@/components/WeeklyGrid";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const typeTone = { CM: "navy" as const, TD: "sky" as const, TP: "green" as const };

export default function EnsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { edt, cours, notifications } = useData();
  const myId = user?.enseignantId ?? "";
  const myCours = cours.filter(c => c.enseignantIds.includes(myId));

  // Statistiques réelles
  const stats = useMemo(() => {
    const volumeTotal = myCours.reduce((a, c) => a + c.volumeHoraire, 0);
    const niveaux = new Set(myCours.map(c => c.niveauLibelle));
    const notifsNonLues = notifications.filter(n => !n.lu).length;
    return {
      nbCours: myCours.length,
      volumeHoraire: `${volumeTotal}h`,
      niveauxEnseignes: niveaux.size,
      notifsNonLues,
    };
  }, [myCours, notifications]);

  // Semaine actuelle formatée
  const semaineCourante = useMemo(() => {
    const now = new Date();
    const debutSemaine = new Date(now);
    debutSemaine.setDate(now.getDate() - now.getDay() + 1); // Lundi
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 4); // Vendredi
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    return `Semaine du ${fmt(debutSemaine)}`;
  }, []);

  return (
    <div className="space-y-5">
      {/* Carte de bienvenue */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emit-navy to-emit-sky text-base font-bold text-white shadow-md">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold">Bonjour {user?.prenom} {user?.nom}</h1>
                <p className="text-sm text-slate-500">
                  {user?.specialite} · <Badge tone="green">{user?.statut}</Badge>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" leftIcon={<User className="h-4 w-4" />} onClick={() => navigate("/enseignant/profil")}>
                Mon profil
              </Button>
              <Button leftIcon={<Download className="h-4 w-4" />} onClick={() => navigate("/enseignant/cours")}>
                Mes cours
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cours cette semaine" value={stats.nbCours} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Volume horaire" value={stats.volumeHoraire} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Niveaux enseignés" value={stats.niveauxEnseignes} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard
          label="Notifs non lues"
          value={stats.notifsNonLues}
          tone={stats.notifsNonLues > 0 ? "red" : "default"}
          icon={<Bell className="h-5 w-5" />}
        />
      </div>

      {/* Planning */}
      <Card>
        <CardHeader
          title="Mon planning"
          subtitle={semaineCourante}
          action={
            <div className="flex gap-1">
              <button className="rounded p-1.5 hover:bg-slate-100 transition-colors" title="Semaine précédente">
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <button className="rounded p-1.5 hover:bg-slate-100 transition-colors" title="Semaine suivante">
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          }
        />
        <CardBody>
          {edt.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarDays className="h-10 w-10 mb-2" />
              <p className="text-sm">Aucun créneau cette semaine</p>
            </div>
          ) : (
            <WeeklyGrid slots={edt} highlightToday />
          )}
        </CardBody>
      </Card>

      {/* Cours + Notifications */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mes cours assignés" subtitle={`${myCours.length} cours`} />
          <CardBody>
            {myCours.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Aucun cours assigné</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myCours.map(c => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.intitule}</p>
                      <p className="text-xs text-slate-500">{c.niveauLibelle} · {c.filiereLibelle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge tone={typeTone[c.type]}>{c.type}</Badge>
                      <span className="text-xs text-slate-500 tabular-nums">{c.volumeHoraire}h</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Notifications récentes"
            subtitle={notifications.length > 0 ? `${stats.notifsNonLues} non lue${stats.notifsNonLues > 1 ? "s" : ""}` : ""}
            action={
              <button
                onClick={() => navigate("/enseignant/notifications")}
                className="text-xs font-medium text-emit-sky hover:text-emit-navy transition-colors"
              >
                Voir tout
              </button>
            }
          />
          <CardBody>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Bell className="h-8 w-8 mb-2" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {notifications.slice(0, 3).map(n => (
                  <li key={n.id} className={`rounded-lg p-3 transition-colors ${!n.lu ? "bg-emit-light/40 border border-emit-sky/20" : "bg-slate-50 border border-transparent"}`}>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{n.titre}</p>
                      {!n.lu && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-600">{n.description}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{n.date}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
