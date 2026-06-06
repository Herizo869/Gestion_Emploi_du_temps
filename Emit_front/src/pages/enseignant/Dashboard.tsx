import { Link } from "react-router-dom";
import { Download, User, BookOpen, Clock, GraduationCap, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/StatCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WeeklyGrid from "@/components/WeeklyGrid";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const typeTone = { CM: "navy", TD: "sky", TP: "green" } as const;

export default function EnsDashboard() {
  const { user } = useAuth();
  const { edt: edtL3Info, cours, notifications } = useData();
  const myId = user?.id ?? "";
  const myCours = cours.filter(c => c.enseignantIds.includes(myId));

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emit-navy text-base font-bold text-white">
                {user?.prenom[0]}{user?.nom[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold">Bonjour {user?.prenom} {user?.nom}</h1>
                <p className="text-sm text-slate-500">
                  {user?.specialite} · <Badge tone="green">{user?.statut}</Badge>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/enseignant/profil"><Button variant="outline" leftIcon={<User className="h-4 w-4" />}>Mon profil</Button></Link>
              <Button leftIcon={<Download className="h-4 w-4" />}>Télécharger PDF</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cours cette semaine" value={6} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Volume horaire" value="9h" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Niveaux enseignés" value={2} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Notifs non lues" value={2} tone="red" icon={<Bell className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader
          title="Mon planning"
          subtitle="Semaine du 12 mai 2025"
          action={
            <div className="flex gap-1">
              <button className="rounded p-1.5 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
              <button className="rounded p-1.5 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
            </div>
          }
        />
        <CardBody><WeeklyGrid slots={edtL3Info} highlightToday /></CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mes cours assignés" />
          <CardBody>
            <ul className="divide-y divide-slate-100">
              {myCours.map(c => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{c.intitule}</p>
                    <p className="text-xs text-slate-500">{c.niveau} · {c.filiere}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={typeTone[c.type]}>{c.type}</Badge>
                    <span className="text-xs text-slate-500 tabular-nums">{c.volumeHoraire}h</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notifications récentes" />
          <CardBody>
            <ul className="space-y-2">
              {notifications.slice(0, 3).map(n => (
                <li key={n.id} className={`rounded-lg p-3 ${!n.lu ? "bg-emit-light/40" : "bg-slate-50"}`}>
                  <p className="text-sm font-medium">{n.titre}</p>
                  <p className="text-xs text-slate-600">{n.description}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{n.date}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
