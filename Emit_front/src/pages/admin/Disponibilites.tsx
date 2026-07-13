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
    <div className="space-y-5">
      {/* ── Alerte de chevauchement : TOUT EN HAUT, avant même le titre ── */}
      {overlapsLive.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Chevauchement détecté — cet enseignant est déjà disponible pour un autre cours sur ce créneau
          </div>
          {overlapsLive.map((o, i) => (
            <p key={i} className="pl-6 text-xs">
              {o.jour} {o.creneau} : <strong>{o.coursActuel}</strong> et <strong>{o.coursAutre}</strong> se chevauchent.
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Disponibilités des enseignants</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)}
            className="h-10 min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            {enseignants.map(ens => (
              <option key={ens.id} value={ens.id}>{ens.prenom} {ens.nom}</option>
            ))}
          </select>
          <select value={semestreId} onChange={(e) => setSemestreId(e.target.value)}
            className="h-10 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            {semestres.map(s => (
              <option key={s.id} value={s.id}>{s.libelle} — {s.annee}</option>
            ))}
          </select>
          <select value={coursId} onChange={(e) => setCoursId(e.target.value)}
            className="h-10 min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emit-sky focus:outline-none focus:ring-2 focus:ring-emit-sky/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            {mesCours.map(c => (
              <option key={c.id} value={c.id}>{c.intitule} — {c.niveauLibelle}</option>
            ))}
          </select>
          <Button
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            onClick={handleSave}
            disabled={saving || loading || !enseignantId || !semestreId || !coursId || overlapsLive.length > 0}
            title={overlapsLive.length > 0 ? "Résolvez les chevauchements signalés en haut avant d'enregistrer" : undefined}
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {enseignantActuel && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <User className="h-4 w-4 text-emit-sky" />
          <span><strong>{enseignantActuel.prenom} {enseignantActuel.nom}</strong></span>
          {coursActuel && (
            <>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <BookOpen className="h-4 w-4 text-emit-sky" />
              <span>{coursActuel.intitule}</span>
              <Badge tone="blue">{coursActuel.niveauLibelle}</Badge>
            </>
          )}
          {loadingAutres && (
            <span className="text-xs text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> vérification des chevauchements…
            </span>
          )}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> ✓ Disponibilités enregistrées avec succès
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {conflits.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Conflit entre deux cours de cet enseignant
          </div>
          {conflits.map((c, i) => (
            <p key={i} className="pl-6 text-xs">
              {c.jour} {c.creneau} : <strong>{c.cours1}</strong> et <strong>{c.cours2}</strong> se chevauchent.
            </p>
          ))}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Légende :</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-green-500 shadow-sm" />Disponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-red-500 shadow-sm" />Indisponible</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-slate-600 border border-slate-300 dark:border-slate-500" />Non renseigné</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-green-100 border-2 border-amber-500" />Chevauchement</span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="text-slate-500 dark:text-slate-400">Cliquez sur une case pour basculer</span>
            {changed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 animate-pulse ml-2">
                <AlertTriangle className="h-3 w-3" /> Non sauvegardé
              </span>
            )}
          </div>

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
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-100 px-3 py-3 text-left text-xs font-semibold text-slate-600 border-r border-slate-200 dark:bg-slate-700/80 dark:text-slate-300 dark:border-slate-600">
                      <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Créneaux</div>
                    </th>
                    {JOURS.map((jour, idx) => (
                      <th key={jour} className={`px-3 py-3 text-center text-xs font-semibold border-b-2 dark:border-b-slate-600 ${idx === new Date().getDay() - 1 ? "bg-emit-light/60 text-emit-navy border-b-emit-sky dark:bg-emit-navy-dark/60 dark:text-emit-sky" : "bg-slate-50 text-slate-600 border-b-slate-200 dark:bg-slate-800/50 dark:text-slate-300"}`}>
                        {jour}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRENEAUX.map((c, r) => (
                    <tr key={c} className="group">
                      <td className="sticky left-0 z-10 bg-slate-50/90 px-3 py-2.5 text-xs font-mono text-slate-600 border-r border-slate-200 font-medium dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-600">{c}</td>
                      {JOURS.map((j, ci) => {
                        const v = grid[r][ci];
                        const isDispo = v === "dispo";
                        const isIndispo = v === "indispo";
                        const isOverlap = overlapSet.has(overlapKey(r, ci));
                        return (
                          <td key={j} className="border border-slate-100 p-1 dark:border-slate-700">
                            <button onClick={() => toggle(r, ci)}
                              className={`relative h-10 w-full rounded-lg border-2 transition-all duration-150 ${
                                isOverlap ? "bg-green-100 border-amber-500 ring-2 ring-amber-400 hover:bg-green-200"
                                : isDispo ? "bg-green-100 border-green-400 hover:bg-green-200 hover:border-green-500"
                                : isIndispo ? "bg-red-100 border-red-400 hover:bg-red-200 hover:border-red-500"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                              title={`${j} ${c}: ${isOverlap ? "Chevauchement avec un autre cours !" : isDispo ? "Disponible" : isIndispo ? "Indisponible" : "Non renseigné"}`}>
                              {isDispo && !isOverlap && <span className="absolute inset-0 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-green-600" /></span>}
                              {isOverlap && <span className="absolute inset-0 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-amber-600" /></span>}
                              {isIndispo && <span className="absolute inset-0 flex items-center justify-center"><XCircle className="h-4 w-4 text-red-600" /></span>}
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

          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Une indisponibilité créant un conflit avec un cours planifié sera signalée à l'admin.
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total cette semaine : <strong className="text-emit-navy text-lg dark:text-emit-sky">{totalHours}h</strong>
            </p>
            {changed && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Modifications non enregistrées</span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}