import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Building2, CalendarCheck, AlertTriangle, Download, Zap,
  ArrowRight, TrendingUp, BookOpen, CheckCircle2, CalendarDays,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useData } from "@/context/DataContext";

// Créneaux et jours standards EMIT
const CRENEAUX = [
  "07h30-09h00", "09h15-10h45", "11h00-12h30",
  "13h30-15h00", "15h15-16h45", "17h00-18h30",
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

type ConflitData = {
  id: string; type: string; description: string; date: string;
  navTo: string;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { salles, journal, enseignants, cours, semestres, notifications, edt } = useData();

  // ── Semestre actif ──────────────────────────────────────────
  const semestreActif = useMemo(() => {
    const publie = [...semestres].reverse().find(s => s.statut === "publie");
    return publie ?? semestres[semestres.length - 1] ?? null;
  }, [semestres]);

  // ── VRAIS CONFLITS depuis les créneaux EDT ──────────────────
  const conflitsReels = useMemo(() => {
    const list: ConflitData[] = [];

    // Conflit Enseignant : même enseignant, même jour, même heure
    const ensGroups = new Map<string, typeof edt>();
    edt.forEach(s => {
      const key = `${s.enseignant}|${s.jour}|${s.debut}`;
      if (!ensGroups.has(key)) ensGroups.set(key, []);
      ensGroups.get(key)!.push(s);
    });
    ensGroups.forEach((slots, key) => {
      if (slots.length > 1) {
        const [ens, jour, heure] = key.split("|");
        const coursList = slots.map(s => s.intitule).join(", ");
        list.push({
          id: `ens-conf-${key.replace(/\|/g, "-")}`,
          type: "Enseignant",
          description: `${ens} programmé ${slots.length}x le ${jour} à ${heure} : ${coursList}`,
          date: "Aujourd'hui",
          navTo: "/admin/edt",
        });
      }
    });

    // Conflit Salle : même salle, même jour, même heure
    const salGroups = new Map<string, typeof edt>();
    edt.forEach(s => {
      const key = `${s.salle}|${s.jour}|${s.debut}`;
      if (!salGroups.has(key)) salGroups.set(key, []);
      salGroups.get(key)!.push(s);
    });
    salGroups.forEach((slots, key) => {
      if (slots.length > 1) {
        const [sal, jour, heure] = key.split("|");
        const coursList = slots.map(s => s.intitule).join(", ");
        list.push({
          id: `sal-conf-${key.replace(/\|/g, "-")}`,
          type: "Salle",
          description: `La salle ${sal} est réservée ${slots.length}x le ${jour} à ${heure} : ${coursList}`,
          date: "Aujourd'hui",
          navTo: "/admin/edt",
        });
      }
    });

    return list;
  }, [edt]);

  // ── STATUT PAR NIVEAU (depuis les vrais créneaux EDT) ──────
  const statutNiveauxReels = useMemo(() => {
    const niveauMap = new Map<string, number>();
    const niveauTotal = new Map<string, number>();
    cours.forEach(c => {
      const prev = niveauTotal.get(c.niveauLibelle) ?? 0;
      niveauTotal.set(c.niveauLibelle, prev + c.volumeHoraire);
    });
    edt.forEach(s => {
      const prev = niveauMap.get(s.niveau) ?? 0;
      niveauMap.set(s.niveau, prev + 1.5); // 1 créneau = 1h30
    });
    return Array.from(niveauTotal.entries()).map(([niv, total]) => {
      const planifie = niveauMap.get(niv) ?? 0;
      const pct = total > 0 ? (planifie / total) * 100 : 0;
      let statut = "Non démarré";
      if (pct >= 100) statut = "Publié";
      else if (pct > 0) statut = "Brouillon";
      return { niveau: niv, statut };
    });
  }, [cours, edt]);

  // ── OCCUPATION RÉELLE des salles (depuis EDT) ──────────────
  const occupationSalles = useMemo(() => {
    const totalCreneaux = CRENEAUX.length * JOURS.length;
    // Indexer par salleId si disponible, sinon par nom de salle
    const salleSlotCount = new Map<string, number>();
    const salleSlotCountById = new Map<string, number>();
    edt.forEach(s => {
      if (s.salleId) {
        const prev = salleSlotCountById.get(s.salleId) ?? 0;
        salleSlotCountById.set(s.salleId, prev + 1);
      } else {
        const prev = salleSlotCount.get(s.salle) ?? 0;
        salleSlotCount.set(s.salle, prev + 1);
      }
    });
    return salles.map(s => {
      // Essayer d'abord par salleId, puis par numero
      const countFromId = salleSlotCountById.get(s.id) ?? 0;
      const countFromName = salleSlotCount.get(s.numero) ?? 0;
      const count = countFromId || countFromName;
      const occupationCalculee = Math.round((count / totalCreneaux) * 100);
      return { ...s, occupationCalculee };
    });
  }, [salles, edt]);

  // ── STATS ───────────────────────────────────────────────────
  const stats = useMemo(() => ({
    enseignants: enseignants.length,
    salles: salles.length,
    cours: cours.length,
    conflits: conflitsReels.length,
    totalVolume: cours.reduce((a, c) => a + c.volumeHoraire, 0),
    heuresPlanifiees: cours.reduce((a, c) => a + c.heuresPlanifiees, 0),
    sallesDisponibles: salles.filter(s => s.disponible).length,
    notifsNonLues: notifications.filter(n => !n.lu).length,
    creneaux: edt.length,
  }), [enseignants, salles, cours, conflitsReels, notifications, edt]);

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500">
            {semestreActif ? (
              <>
                Semestre actif :{" "}
                <span className="font-medium text-slate-700">{semestreActif.libelle} — {semestreActif.annee}</span>{" "}
                <Badge tone={semestreActif.statut === "publie" ? "green" : semestreActif.statut === "archive" ? "gray" : "orange"}>
                  {semestreActif.statut === "publie" ? "Publié" : semestreActif.statut === "archive" ? "Archivé" : "Brouillon"}
                </Badge>
              </>
            ) : (
              <span className="text-slate-400">Aucun semestre actif</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => navigate("/admin/export")}>
            Exporter
          </Button>
          <Button leftIcon={<Zap className="h-4 w-4" />} onClick={() => navigate("/admin/generer")}>
            Générer EDT
          </Button>
        </div>
      </div>

      {/* ═══ STATCARDS PRINCIPALES ═══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enseignants" value={stats.enseignants} icon={<Users className="h-5 w-5" />} onClick={() => navigate("/admin/enseignants")} />
        <StatCard label="Salles" value={stats.salles} icon={<Building2 className="h-5 w-5" />} onClick={() => navigate("/admin/salles")} />
        <StatCard label="Créneaux planifiés" value={stats.creneaux} icon={<CalendarCheck className="h-5 w-5" />} onClick={() => navigate("/admin/edt")} />
        <StatCard label="Conflits" value={stats.conflits} tone={stats.conflits > 0 ? "red" : "green"} icon={<AlertTriangle className="h-5 w-5" />} onClick={() => navigate("/admin/edt")} />
      </div>

      {/* ═══ STATCARDS SECONDAIRES ═══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Volume horaire total" value={`${stats.totalVolume}h`} icon={<BookOpen className="h-5 w-5" />} tone="blue" />
        <StatCard label="Heures planifiées" value={`${stats.heuresPlanifiees}h`} icon={<TrendingUp className="h-5 w-5" />} tone="blue" />
        <StatCard label="Salles disponibles" value={stats.sallesDisponibles} icon={<Building2 className="h-5 w-5" />} tone="green" onClick={() => navigate("/admin/salles")} />
        <StatCard label="Notifications non lues" value={stats.notifsNonLues} icon={<AlertTriangle className="h-5 w-5" />} tone={stats.notifsNonLues > 0 ? "red" : "default"} onClick={() => navigate("/admin/historique")} />
      </div>

      {/* ═══ CONFLITS + STATUT NIVEAUX ═══ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Vrais conflits EDT ── */}
        <Card>
          <CardHeader
            title="Conflits d'emploi du temps"
            subtitle={conflitsReels.length > 0 ? `${conflitsReels.length} conflit${conflitsReels.length > 1 ? "s" : ""} détecté${conflitsReels.length > 1 ? "s" : ""}` : "Aucun conflit"}
          />
          <CardBody className="max-h-80 overflow-y-auto">
            {conflitsReels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 className="h-10 w-10 text-green-400 mb-2" />
                <p className="text-sm font-medium text-green-600">Planning cohérent</p>
                <p className="text-xs mt-1">Aucun conflit d'enseignant ou de salle détecté</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {conflitsReels.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => navigate(c.navTo)}
                    className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3 hover:bg-red-100/80 transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">
                        {c.type === "Salle" ? "🏛️ Salle" : "👤 Enseignant"} — Double réservation
                      </p>
                      <p className="text-xs text-red-700 line-clamp-2 mt-0.5">{c.description}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{c.date}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(c.navTo); }}>
                      Voir l'EDT
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ── Statut par niveau ── */}
        <Card>
          <CardHeader title="Avancement par niveau" subtitle="Progression de l'EDT" />
          <CardBody>
            {statutNiveauxReels.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Aucun niveau configuré</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {statutNiveauxReels.map((r) => (
                    <tr key={r.niveau} className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50 cursor-pointer" onClick={() => navigate("/admin/edt")}>
                      <td className="py-3 font-medium">{r.niveau}</td>
                      <td className="py-3 text-right">
                        {r.statut === "Publié" && <Badge tone="green">Publié</Badge>}
                        {r.statut === "Brouillon" && <Badge tone="orange">Brouillon</Badge>}
                        {r.statut === "Non démarré" && <Badge tone="gray">Non démarré</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ═══ OCCUPATION SALLES + ACTIVITÉ ═══ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Occupation réelle des salles ── */}
        <Card>
          <CardHeader title="Occupation des salles" subtitle="Calculée depuis les créneaux EDT réels" />
          <CardBody className="space-y-3">
            {occupationSalles.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Aucune salle configurée</p>
            ) : (
              occupationSalles.slice(0, 5).map((s) => (
                <div key={s.id} className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm rounded-lg p-2 hover:bg-slate-50 cursor-pointer" onClick={() => navigate("/admin/edt")}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {s.numero} <span className="text-slate-400">(Bât. {s.batiment})</span>
                      {!s.disponible && <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Indispo</span>}
                    </span>
                    <span className={`font-semibold tabular-nums ${s.occupationCalculee > 90 ? "text-red-600" : s.occupationCalculee > 70 ? "text-orange-500" : "text-slate-500"}`}>
                      {s.occupationCalculee}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.occupationCalculee > 90 ? "bg-red-500" : s.occupationCalculee > 70 ? "bg-orange-400" : "bg-emit-blue"
                      }`}
                      style={{ width: `${Math.min(s.occupationCalculee, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            {salles.length > 5 && (
              <button onClick={() => navigate("/admin/salles")} className="flex items-center gap-1 text-xs font-medium text-emit-sky hover:text-emit-navy transition-colors">
                Voir toutes les salles <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </CardBody>
        </Card>

        {/* ── Activité récente ── */}
        <Card>
          <CardHeader title="Activité récente" subtitle="Dernières actions" />
          <CardBody>
            {journal.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CalendarDays className="h-8 w-8 mb-2" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {journal.slice(0, 6).map((j) => (
                  <li key={j.id} className="flex items-start gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 rounded-lg p-2 cursor-default">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emit-light text-xs text-emit-navy font-bold">
                      {j.action[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        <span className="font-medium">{j.action}</span> — {j.entite}
                      </p>
                      <p className="text-[11px] text-slate-400">{j.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => navigate("/admin/historique")} className="mt-3 flex items-center gap-1 text-xs font-medium text-emit-sky hover:text-emit-navy transition-colors">
              Voir tout l'historique <ArrowRight className="h-3 w-3" />
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
