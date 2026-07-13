import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import WeeklyGrid from "@/components/WeeklyGrid";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiEdtMe } from "@/lib/api";
import { useData } from "@/context/DataContext";
import type { SlotEDT } from "@/types";

const typeTone = { CM: "navy", TD: "sky", TP: "green" } as const;

export default function EnsEdt() {
  const { semestres } = useData();
  const [slots, setSlots] = useState<SlotEDT[]>([]);
  const [semestreId, setSemestreId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(19);

  // Sélectionner le semestre publié par défaut
  useEffect(() => {
    if (semestres.length > 0 && !semestreId) {
      const publie = [...semestres].reverse().find((s) => s.statut === "publie");
      setSemestreId((publie ?? semestres[semestres.length - 1]).id);
    }
  }, [semestres, semestreId]);

  // Charger l'EDT filtré pour l'enseignant connecté
  useEffect(() => {
    if (!semestreId) return;
    setLoading(true);
    apiEdtMe(semestreId)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [semestreId]);

  const semestreActuel = semestres.find((s) => s.id === semestreId);

  // Statistiques dérivées
  const stats = useMemo(() => {
    const totalHeures = slots.length * 1.5; // 1h30 par créneau
    const types = new Set(slots.map((s) => s.type));
    const salles = new Set(slots.map((s) => s.salle));
    const jours = new Set(slots.map((s) => s.jour));
    return {
      totalCreneaux: slots.length,
      totalHeures,
      types: types.size,
      salles: salles.size,
      jours: jours.size,
    };
  }, [slots]);

  return (
    <div className="space-y-5">
      {/* Entête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mon emploi du temps</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Planning des cours qui vous sont assignés
          </p>
        </div>
        <select
          value={semestreId}
          onChange={(e) => setSemestreId(e.target.value)}
          className="h-10 min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20"
        >
          {semestres.map((s) => (
            <option key={s.id} value={s.id}>
              {s.libelle} — {s.annee}
            </option>
          ))}
        </select>
      </div>

      {/* Cartes statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emit-navy/10">
                <CalendarDays className="h-5 w-5 text-emit-navy" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Créneaux</p>
                <p className="text-xl font-bold text-slate-900">{stats.totalCreneaux}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Volume horaire</p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.totalHeures}h
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                <BookOpen className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Salles</p>
                <p className="text-xl font-bold text-slate-900">{stats.salles}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <GraduationCap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Types cours</p>
                <p className="text-xl font-bold text-slate-900">{stats.types}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Navigation semaine + Légende */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeek((w) => Math.max(1, w - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emit-sky hover:bg-emit-light/70 hover:text-emit-navy"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <div className="text-sm font-bold text-emit-navy">Semaine {week}</div>
            <div className="text-xs text-slate-400">
              {semestreActuel?.libelle ?? "Semestre"} — {semestreActuel?.annee ?? ""}
            </div>
          </div>
          <button
            onClick={() => setWeek((w) => w + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-emit-sky hover:bg-emit-light/70 hover:text-emit-navy"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {(["CM", "TD", "TP"] as const).map((type) => (
            <span
              key={type}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500"
            >
              <Badge tone={typeTone[type]}>{type}</Badge>
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {slots.length} créneau{slots.length > 1 ? "x" : ""}
          </span>
        </div>
      </div>

      {/* Grille EDT */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardBody>
        </Card>
      ) : slots.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <CalendarDays className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-slate-700">
                Aucun créneau pour le moment
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Votre emploi du temps apparaîtra ici dès que l'administrateur aura généré le
                planning.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Planning hebdomadaire"
            subtitle={`${slots.length} créneau${slots.length > 1 ? "x" : ""} cette semaine`}
          />
          <CardBody>
            <WeeklyGrid slots={slots} highlightToday />
          </CardBody>
        </Card>
      )}

      {/* Résumé */}
      {slots.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-xs text-slate-500">
          <p>
            <strong className="text-slate-700">{stats.totalCreneaux} créneaux</strong> répartis
            sur <strong className="text-slate-700">{stats.jours} jours</strong> dans{" "}
            <strong className="text-slate-700">{stats.salles} salles</strong> · Volume total :{" "}
            <strong className="text-slate-700">{stats.totalHeures}h</strong>
          </p>
        </div>
      )}
    </div>
  );
}
