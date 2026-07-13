import { useState, useEffect, useMemo } from "react";
import { Save, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, BookOpen, User } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { apiDisposEnseignant, apiSaveDisponibilites, type ConflitDispo } from "@/lib/api";
import { useData } from "@/context/DataContext";

const CRENEAUX = [
  "07h00 - 08h00", "08h00 - 09h00", "09h00 - 10h00", "10h00 - 11h00", "11h00 - 12h00",
  "14h00 - 15h00", "15h00 - 16h00", "16h00 - 17h00", "17h00 - 18h00",
] as const;
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;
const NB_CRENEAUX = CRENEAUX.length;
const NB_JOURS = JOURS.length;

type State = "dispo" | "indispo" | "vide";

// Disponibilité "disponible" d'un AUTRE cours du même enseignant, utilisée
// pour détecter un chevauchement en direct, sans appel serveur.
type AutreDispo = { jour: string; creneau: string; coursIntitule: string };

// Chevauchement détecté côté client (avant sauvegarde)
type OverlapLive = { r: number; c: number; jour: string; creneau: string; coursActuel: string; coursAutre: string };

export default function AdminDisponibilites() {
  // Toutes les données sont déjà chargées globalement (admin) — pas d'appel "/me" ici,
  // c'est l'admin qui choisit EXPLICITEMENT quel enseignant gérer.
  const { semestres, enseignants, cours, loading: dataLoading } = useData();

  const [enseignantId, setEnseignantId] = useState<string>("");
  const [semestreId, setSemestreId] = useState<string>("");
  const [coursId, setCoursId] = useState<string>("");

  const [grid, setGrid] = useState<State[][]>(
    () => Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State))
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [conflits, setConflits] = useState<ConflitDispo[]>([]);

  // Disponibilités "disponible" de TOUS les autres cours de cet enseignant sur ce semestre
  const [autresDispos, setAutresDispos] = useState<AutreDispo[]>([]);
  const [loadingAutres, setLoadingAutres] = useState(false);

  // Chevauchements détectés en direct (dès le clic sur une case)
  const [overlapsLive, setOverlapsLive] = useState<OverlapLive[]>([]);

  // ── Sélection par défaut : premier enseignant / semestre publié ──────────
  useEffect(() => {
    if (enseignants.length > 0 && !enseignantId) setEnseignantId(enseignants[0].id);
  }, [enseignants, enseignantId]);

  useEffect(() => {
    if (semestres.length > 0 && !semestreId) {
      const publie = [...semestres].reverse().find(s => s.statut === "publie");
      setSemestreId((publie ?? semestres[semestres.length - 1]).id);
    }
  }, [semestres, semestreId]);

  // ── Cours de l'enseignant sélectionné (dérivé de la liste globale, pas de "me") ──
  const mesCours = useMemo(
    () => cours.filter(c => c.enseignantIds.includes(enseignantId)),
    [cours, enseignantId]
  );

  // Quand l'enseignant change, on réinitialise le cours sélectionné sur le premier disponible
  useEffect(() => {
    if (mesCours.length > 0) {
      if (!coursId || !mesCours.some(c => c.id === coursId)) {
        setCoursId(mesCours[0].id);
      }
    } else {
      setCoursId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesCours]);

  // ── Charge la grille de l'enseignant/cours sélectionnés ──────────────────
  useEffect(() => {
    if (!enseignantId || !semestreId || !coursId) {
      setGrid(Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State)));
      return;
    }
    setLoading(true);
    apiDisposEnseignant(enseignantId, semestreId, coursId)
      .then(dispos => {
        const newGrid = Array.from({ length: NB_CRENEAUX }, () => Array(NB_JOURS).fill("vide" as State));
        dispos.forEach(d => {
          const row = CRENEAUX.indexOf(d.creneau as typeof CRENEAUX[number]);
          const col = JOURS.indexOf(d.jour as typeof JOURS[number]);
          if (row >= 0 && col >= 0) {
            newGrid[row][col] = d.estDisponible ? "dispo" : "indispo";
          }
        });
        setGrid(newGrid);
        setChanged(false);
      })
      .catch((e: any) => setError(e?.message ?? "Erreur lors du chargement des disponibilités"))
      .finally(() => setLoading(false));
  }, [enseignantId, semestreId, coursId]);

  // ── Charge les disponibilités "disponible" de TOUS les autres cours de cet enseignant ──
  // Sert uniquement à détecter les chevauchements en direct côté client.
  useEffect(() => {
    if (!enseignantId || !semestreId || mesCours.length === 0) {
      setAutresDispos([]);
      return;
    }
    const autresCours = mesCours.filter(c => c.id !== coursId);
    if (autresCours.length === 0) {
      setAutresDispos([]);
      return;
    }

    let cancelled = false;
    setLoadingAutres(true);

    Promise.all(
      autresCours.map(c =>
        apiDisposEnseignant(enseignantId, semestreId, c.id)
          .then(dispos =>
            dispos
              .filter(d => d.estDisponible)
              .map(d => ({ jour: d.jour, creneau: d.creneau, coursIntitule: c.intitule }))
          )
          .catch(() => [] as AutreDispo[])
      )
    ).then(results => {
      if (cancelled) return;
      setAutresDispos(results.flat());
      setLoadingAutres(false);
    });

    return () => { cancelled = true; };
  }, [enseignantId, semestreId, coursId, mesCours]);

  // ── Détecte les chevauchements en direct dès que la grille change ────────
  useEffect(() => {
    const coursActuel = mesCours.find(c => c.id === coursId);
    if (!coursActuel || autresDispos.length === 0) {
      setOverlapsLive([]);
      return;
    }

    const found: OverlapLive[] = [];
    for (let r = 0; r < NB_CRENEAUX; r++) {
      for (let c = 0; c < NB_JOURS; c++) {
        if (grid[r][c] !== "dispo") continue;
        const jour = JOURS[c];
        const creneau = CRENEAUX[r];
        const conflitAutre = autresDispos.find(a => a.jour === jour && a.creneau === creneau);
        if (conflitAutre) {
          found.push({
            r, c, jour, creneau,
            coursActuel: coursActuel.intitule,
            coursAutre: conflitAutre.coursIntitule,
          });
        }
      }
    }
    setOverlapsLive(found);
  }, [grid, autresDispos, mesCours, coursId]);

  const toggle = (r: number, c: number) => {
    setGrid(g => {
      const copy = g.map(row => [...row]);
      copy[r][c] = copy[r][c] === "vide" ? "dispo" : copy[r][c] === "dispo" ? "indispo" : "vide";
      return copy;
    });
    setChanged(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!enseignantId) return setError("Veuillez sélectionner un enseignant");
    if (!semestreId) return setError("Veuillez sélectionner un semestre");
    if (!coursId) return setError("Veuillez sélectionner un cours");

    // On bloque la sauvegarde immédiatement si un chevauchement est détecté,
    // pas besoin d'attendre le refus du serveur.
    if (overlapsLive.length > 0) {
      return setError("Veuillez d'abord résoudre le(s) chevauchement(s) signalé(s) en haut de page avant d'enregistrer.");
    }

    setSaving(true);
    setError(null);
    try {
      const disponibilites = [];
      for (let r = 0; r < NB_CRENEAUX; r++) {
        for (let c = 0; c < NB_JOURS; c++) {
          const state = grid[r][c];
          if (state !== "vide") {
            disponibilites.push({ jour: JOURS[c], creneau: CRENEAUX[r], estDisponible: state === "dispo", estIndisponible: state === "indispo" });
          }
        }
      }
      const res = await apiSaveDisponibilites(enseignantId, semestreId, coursId, disponibilites as any);
      setConflits(res.conflits ?? []);
      setSaved(true);
      setChanged(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  const totalHours = grid.flat().filter(v => v === "dispo").length * 1;
  const coursActuel = mesCours.find(c => c.id === coursId);
  const enseignantActuel = enseignants.find(e => e.id === enseignantId);

  // Cases à surligner dans le tableau car concernées par un chevauchement
  const overlapKey = (r: number, c: number) => `${r}-${c}`;
  const overlapSet = new Set(overlapsLive.map(o => overlapKey(o.r, o.c)));

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ── Alerte de chevauchement : TOUT EN HAUT, avant même le titre ── */}
      {overlapsLive.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-3 text-sm text-amber-800 shadow-[0_0_15px_rgba(251,191,36,0.15)] dark:border-amber-500/40 dark:from-amber-900/25 dark:to-orange-900/15 dark:text-amber-200">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            Chevauchement détecté — cet enseignant est déjà disponible pour un autre cours sur ce créneau
          </div>
          {overlapsLive.map((o, i) => (
            <p key={i} className="pl-6 text-xs text-amber-700 dark:text-amber-300">
              {o.jour} {o.creneau} : <strong>{o.coursActuel}</strong> et <strong>{o.coursAutre}</strong> se chevauchent.
            </p>
          ))}
        </div>
      )}

      {/* ── Panneau de sélection avec glassmorphisme ── */}
      <div className="rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-md px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/60">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emit-navy to-emit-sky bg-clip-text text-transparent dark:from-emit-sky dark:to-blue-300">
            Disponibilités des enseignants
          </h1>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)}
                className="h-9 min-w-[190px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm appearance-none cursor-pointer focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                {enseignants.map(ens => (
                  <option key={ens.id} value={ens.id}>{ens.prenom} {ens.nom}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <select value={semestreId} onChange={(e) => setSemestreId(e.target.value)}
                className="h-9 min-w-[170px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm appearance-none cursor-pointer focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                {semestres.map(s => (
                  <option key={s.id} value={s.id}>{s.libelle} — {s.annee}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select value={coursId} onChange={(e) => setCoursId(e.target.value)}
                className="h-9 min-w-[210px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm appearance-none cursor-pointer focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 transition-colors dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                {mesCours.map(c => (
                  <option key={c.id} value={c.id}>{c.intitule} — {c.niveauLibelle}</option>
                ))}
              </select>
            </div>
            <Button
              leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              onClick={handleSave}
              disabled={saving || loading || !enseignantId || !semestreId || !coursId || overlapsLive.length > 0}
              title={overlapsLive.length > 0 ? "Résolvez les chevauchements signalés en haut avant d'enregistrer" : undefined}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>

        {enseignantActuel && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emit-sky/15 to-blue-50 px-2.5 py-0.5 text-xs font-medium text-emit-navy dark:from-emit-sky/10 dark:to-blue-900/20 dark:text-emit-sky">
              <User className="h-3 w-3" /> {enseignantActuel.prenom} {enseignantActuel.nom}
            </span>
            {coursActuel && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emit-light/60 px-2.5 py-0.5 text-xs font-medium text-emit-navy dark:bg-emit-navy-dark/60 dark:text-emit-sky">
                  <BookOpen className="h-3 w-3" /> {coursActuel.intitule}
                </span>
                <Badge tone="navy">{coursActuel.niveauLibelle}</Badge>
              </>
            )}
            {loadingAutres && (
              <span className="text-xs text-slate-400 dark:text-slate-500 inline-flex items-center gap-1 ml-auto">
                <Loader2 className="h-3 w-3 animate-spin" /> vérification chevauchements…
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Alertes ── */}
      <div className="space-y-2">
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50/80 px-4 py-2.5 text-sm text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.1)] dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-green-900/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>✓ Disponibilités enregistrées avec succès</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50/80 px-4 py-2.5 text-sm text-red-700 dark:border-red-800/50 dark:from-red-900/20 dark:to-rose-900/10 dark:text-red-300">
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}
        {conflits.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-3 text-sm text-amber-800 shadow-[0_0_12px_rgba(251,191,36,0.1)] dark:border-amber-500/30 dark:from-amber-900/20 dark:to-orange-900/10 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /> Conflit entre deux cours de cet enseignant
            </div>
            {conflits.map((c, i) => (
              <p key={i} className="pl-6 text-xs text-amber-700 dark:text-amber-300">
                {c.jour} {c.creneau} : <strong>{c.cours1}</strong> et <strong>{c.cours2}</strong> se chevauchent.
              </p>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* ── Légende améliorée ── */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Légende :</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-b from-green-50 to-emerald-50/50 dark:from-green-900/15 dark:to-emerald-900/10">
              <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-green-400 to-green-500 shadow-sm" />Disponible
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-b from-red-50 to-rose-50/50 dark:from-red-900/15 dark:to-rose-900/10">
              <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-red-400 to-red-500 shadow-sm" />Indisponible
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-b from-slate-50 to-gray-50/50 dark:from-slate-800/50 dark:to-gray-800/30">
              <span className="h-3 w-3 rounded-sm bg-slate-200 border border-slate-300 dark:bg-slate-600 dark:border-slate-500" />Non renseigné
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-b from-amber-50 to-yellow-50/50 dark:from-amber-900/15 dark:to-yellow-900/10">
              <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-amber-300 to-amber-400 border border-amber-500 shadow-sm" />Chevauchement
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-400 dark:text-slate-500 italic">Cliquez sur une case pour basculer</span>
            {changed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse ml-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> Non sauvegardé
              </span>
            )}
          </div>

          {/* ── Corps du tableau ── */}
          {dataLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emit-sky" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des données...</p>
              </div>
            </div>
          ) : enseignants.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400">
              Aucun enseignant en base. Ajoutez-en un depuis la page "Enseignants".
            </div>
          ) : mesCours.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400">
              Aucun cours n'est assigné à {enseignantActuel ? `${enseignantActuel.prenom} ${enseignantActuel.nom}` : "cet enseignant"}.
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emit-sky" />
                <p className="text-sm text-slate-500">Chargement des disponibilités...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-gradient-to-b from-emit-navy/90 to-emit-navy/70 px-3 py-3.5 text-left text-xs font-bold text-white/90 border-r border-white/10 tracking-wider uppercase dark:from-emit-navy-dark dark:to-slate-800/90 dark:border-slate-600">
                      <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Créneaux</div>
                    </th>
                    {JOURS.map((jour, idx) => {
                      const isToday = idx === new Date().getDay() - 1;
                      return (
                        <th key={jour} className={`px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                          isToday
                            ? "bg-gradient-to-b from-emit-sky/30 to-emit-light/40 text-emit-navy border-b-emit-sky dark:from-emit-sky/15 dark:to-emit-navy-dark/40 dark:text-emit-sky dark:border-b-emit-sky-dark"
                            : "bg-gradient-to-b from-slate-100/80 to-slate-50/60 text-slate-700 border-b-slate-200 dark:from-slate-700/60 dark:to-slate-800/40 dark:text-slate-300 dark:border-b-slate-600"
                        }`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{jour}</span>
                            {isToday && <span className="text-[10px] font-normal text-emit-sky-dark dark:text-emit-sky opacity-70">Aujourd'hui</span>}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {CRENEAUX.map((c, r) => (
                    <tr key={c} className="group transition-colors duration-150 even:bg-slate-50/40 hover:bg-emit-sky/[0.03] dark:even:bg-slate-700/20 dark:hover:bg-emit-sky/[0.05]">
                      <td className="sticky left-0 z-10 bg-gradient-to-r from-slate-50/95 to-white/90 px-3 py-2.5 text-xs font-mono text-slate-600 border-r border-slate-200 font-semibold group-hover:from-emit-light/40 group-hover:to-white/60 dark:from-slate-800/95 dark:to-slate-800/90 dark:text-slate-300 dark:border-slate-600 dark:group-hover:from-emit-navy-dark/60 dark:group-hover:to-slate-800/80">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-emit-sky/40 group-hover:bg-emit-sky transition-colors" />
                          {c}
                        </span>
                      </td>
                      {JOURS.map((j, ci) => {
                        const v = grid[r][ci];
                        const isDispo = v === "dispo";
                        const isIndispo = v === "indispo";
                        const isOverlap = overlapSet.has(overlapKey(r, ci));
                        return (
                          <td key={j} className="border border-slate-100 p-1 dark:border-slate-700/60">
                            <button onClick={() => toggle(r, ci)}
                              className={`relative h-10 w-full rounded-lg border-2 transition-all duration-200 active:scale-95 ${
                                isOverlap
                                  ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-500 ring-2 ring-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.2)] hover:from-amber-100 hover:to-yellow-100 hover:shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                                  : isDispo
                                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-sm hover:from-green-100 hover:to-emerald-100 hover:border-green-500 hover:shadow-md"
                                  : isIndispo
                                  ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-400 shadow-sm hover:from-red-100 hover:to-rose-100 hover:border-red-500 hover:shadow-md"
                                  : "bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:from-slate-100 hover:to-slate-50 hover:border-slate-300 hover:shadow-sm dark:from-slate-700/40 dark:to-slate-800/30 dark:border-slate-600 dark:hover:from-slate-600/50 dark:hover:to-slate-700/40"
                              }`}
                              title={`${j} ${c}: ${isOverlap ? "Chevauchement avec un autre cours !" : isDispo ? "Disponible" : isIndispo ? "Indisponible" : "Non renseigné"}`}>
                              {isDispo && !isOverlap && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <CheckCircle2 className="h-5 w-5 text-green-500 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
                                </span>
                              )}
                              {isOverlap && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <AlertTriangle className="h-5 w-5 text-amber-500 drop-shadow-sm transition-transform duration-200 animate-pulse" />
                                </span>
                              )}
                              {isIndispo && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <XCircle className="h-5 w-5 text-red-500 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Info ── */}
          <div className="flex items-center gap-2 rounded-xl border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50/60 px-3 py-2.5 text-sm text-orange-700 dark:border-orange-800/40 dark:from-orange-900/15 dark:to-amber-900/10 dark:text-orange-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
            Une indisponibilité créant un conflit avec un cours planifié sera signalée à l'admin.
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Total cette semaine :</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emit-navy to-emit-sky px-2.5 py-0.5 text-lg font-bold text-white shadow-sm dark:from-emit-navy-dark dark:to-emit-sky-dark">
                {totalHours}h
              </span>
            </div>
            {changed && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="h-3 w-3" /> Modifications non enregistrées
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}