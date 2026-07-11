import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Building2, CalendarCheck, AlertTriangle, Plus, Download, Zap, ArrowRight, TrendingUp, BookOpen, CheckCircle2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useData } from "@/context/DataContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { salles, journal, enseignants, cours, semestres, notifications } = useData();

  // Semestre actif (le plus récent publié, ou dernier brouillon)
  const semestreActif = useMemo(() => {
    const publie = [...semestres].reverse().find(s => s.statut === "publie");
    return publie ?? semestres[semestres.length - 1] ?? null;
  }, [semestres]);

  // Vrais conflits : détection des problèmes
  const conflitsReels = useMemo(() => {
    const list: { id: string; type: string; description: string; date: string }[] = [];
    const conflitsSalle = salles.filter(s => s.occupation > 90);
    conflitsSalle.forEach(s => list.push({
      id: `salle-${s.id}`, type: "Salle",
      description: `La salle ${s.numero} (Bât. ${s.batiment}) a une occupation de ${s.occupation}%`,
      date: "Aujourd'hui"
    }));
    const coursNonPlanifies = cours.filter(c => c.heuresPlanifiees === 0);
    coursNonPlanifies.forEach(c => list.push({
      id: `cours-${c.id}`, type: "Cours",
      description: `"${c.intitule}" (${c.niveauLibelle} ${c.filiereLibelle}) — 0h planifiées sur ${c.volumeHoraire}h`,
      date: "Aujourd'hui"
    }));
    const enseignantsSurcharges = enseignants.filter(e =>
      (e.heuresDisponibles ?? 0) > 0 && (e.heuresPlanifiees ?? 0) > (e.heuresDisponibles ?? 0)
    );
    enseignantsSurcharges.forEach(e => list.push({
      id: `ens-${e.id}`, type: "Enseignant",
      description: `${e.prenom} ${e.nom} — ${e.heuresPlanifiees ?? 0}h planifiées > ${e.heuresDisponibles ?? 0}h disponibles`,
      date: "Aujourd'hui"
    }));
    return list; // pas de slice — le comptage et l'affichage utilisent la même source
  }, [cours, salles, enseignants]);

  // Statut par niveau : calculé à partir des cours/EDT réels
  const statutNiveauxReels = useMemo(() => {
    const niveauSet = new Set(cours.map(c => c.niveauLibelle));
    return Array.from(niveauSet).map(niv => {
      const coursNiv = cours.filter(c => c.niveauLibelle === niv);
      const totalPlanifie = coursNiv.reduce((a, c) => a + c.heuresPlanifiees, 0);
      const totalVolume = coursNiv.reduce((a, c) => a + c.volumeHoraire, 0);
      const pct = totalVolume > 0 ? (totalPlanifie / totalVolume) * 100 : 0;
      let statut: string;
      if (pct === 0) statut = "Non démarré";
      else if (pct >= 100) statut = "Publié";
      else statut = "Brouillon";
      return { niveau: niv, statut };
    });
  }, [cours]);

  // Stats calculées
  const stats = useMemo(() => ({
    enseignants: enseignants.length,
    salles: salles.length,
    cours: cours.length,
    conflits: conflitsReels.length,
    totalVolume: cours.reduce((a, c) => a + c.volumeHoraire, 0),
    heuresPlanifiees: cours.reduce((a, c) => a + c.heuresPlanifiees, 0),
    sallesDisponibles: salles.filter(s => s.disponible).length,
    notifsNonLues: notifications.filter(n => !n.lu).length,
  }), [enseignants, salles, cours, conflitsReels, notifications]);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enseignants" value={stats.enseignants} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Salles" value={stats.salles} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Cours planifiés" value={stats.cours} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard label="Conflits actifs" value={stats.conflits} tone="red" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {/* Grille secondaire */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Volume horaire total" value={`${stats.totalVolume}h`} icon={<BookOpen className="h-5 w-5" />} tone="blue" />
        <StatCard label="Heures planifiées" value={`${stats.heuresPlanifiees}h`} icon={<TrendingUp className="h-5 w-5" />} tone="blue" />
        <StatCard label="Salles disponibles" value={stats.sallesDisponibles} icon={<Building2 className="h-5 w-5" />} tone="green" />
        <StatCard label="Notifications non lues" value={stats.notifsNonLues} icon={<AlertTriangle className="h-5 w-5" />} tone={stats.notifsNonLues > 0 ? "red" : "default"} />
      </div>

      {/* Conflits + Statut */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Alertes conflits" subtitle="Non résolus" />
          <CardBody className="max-h-80 overflow-y-auto">
            {conflitsReels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-green-400 mb-2" />
                <p className="text-sm">Aucun conflit détecté</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {conflitsReels.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Conflit {c.type}</p>
                      <p className="text-xs text-red-700">{c.description}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{c.date}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(c.type === "Salle" ? "/admin/salles" : "/admin/cours")}>
                      Voir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Statut par niveau" subtitle="État de progression de l'EDT" />
          <CardBody>
            {statutNiveauxReels.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Aucun niveau configuré</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {statutNiveauxReels.map((r) => (
                    <tr key={r.niveau} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 font-medium">{r.niveau}</td>
                      <td className="py-2.5 text-right">
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

      {/* Actions rapides */}
      <Card>
        <CardHeader title="Actions rapides" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button leftIcon={<Zap className="h-4 w-4" />} onClick={() => navigate("/admin/generer")}>
              Générer EDT
            </Button>
            <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/admin/enseignants")}>
              Ajouter enseignant
            </Button>
            <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/admin/salles")}>
              Ajouter salle
            </Button>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => navigate("/admin/export")}>
              Exporter PDF
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Occupation salles + Activité */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Occupation des salles" subtitle="Taux d'occupation moyen" />
          <CardBody className="space-y-3">
            {salles.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Aucune salle configurée</p>
            ) : (
              salles.slice(0, 5).map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{s.numero} (Bât. {s.batiment})</span>
                    <span className={s.occupation > 90 ? "font-semibold text-red-600" : "text-slate-500"}>
                      {s.occupation}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-500 ${s.occupation > 90 ? "bg-red-500" : s.occupation > 70 ? "bg-orange-400" : "bg-emit-blue"}`}
                      style={{ width: `${Math.min(s.occupation, 100)}%` }}
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

        <Card>
          <CardHeader title="Activité récente" subtitle="Dernières actions" />
          <CardBody>
            {journal.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Aucune activité récente</p>
            ) : (
              <ul className="space-y-3">
                {journal.slice(0, 5).map((j) => (
                  <li key={j.id} className="flex items-start gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emit-light text-xs text-emit-navy font-bold">
                      {j.action[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">
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
