import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, FileSpreadsheet, Link2, Upload, Check, History as HistoryIcon, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WeeklyGrid from "@/components/WeeklyGrid";
import { useData } from "@/context/DataContext";
import {
  apiEdt, apiDownloadPdf, apiDownloadCsv,
  apiPublierSemestre, apiDepublierSemestre,
} from "@/lib/api";
import type { ExportHistoryEntry, SlotEDT } from "@/types";

const HISTORY_KEY = "emit-export-history";
const MAX_HISTORY = 50;

function loadHistory(): ExportHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ExportHistoryEntry[]) : [];
  } catch { return []; }
}

function saveHistory(entries: ExportHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch { /* localStorage plein — silencieux */ }
}

function formatLabel(entries: { id: string; libelle?: string; numero?: string }[], id: string | undefined): string {
  if (!id) return "—";
  const e = entries.find((x) => x.id === id);
  return e?.libelle ?? e?.numero ?? "—";
}

export default function AdminExport() {
  const { semestres, niveaux, salles, refresh } = useData();

  const [semestreId, setSemestreId] = useState("");
  const [niveauId, setNiveauId] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [salleId, setSalleId] = useState("");

  const [slots, setSlots] = useState<SlotEDT[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Persister l'historique dans localStorage à chaque modification
  useEffect(() => {
    if (history.length > 0) saveHistory(history);
  }, [history]);

  useEffect(() => {
    return () => clearTimeout(doneTimerRef.current);
  }, []);

  useEffect(() => {
    if (!semestreId && semestres.length > 0) setSemestreId(semestres[0].id);
  }, [semestres, semestreId]);

  const filieresDuNiveau = useMemo(
    () => niveaux.find((n) => n.id === niveauId)?.filieres ?? [],
    [niveaux, niveauId]
  );
  useEffect(() => { setFiliereId(""); }, [niveauId]);

  const semestreActuel = semestres.find((s) => s.id === semestreId);

  useEffect(() => {
    if (!semestreId) return;
    setLoading(true);
    apiEdt({
      semestreId,
      niveauId: niveauId || undefined,
      filiereId: filiereId || undefined,
      salleId: salleId || undefined,
    })
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [semestreId, niveauId, filiereId, salleId]);

  const exportParams = { semestreId, niveauId: niveauId || undefined, filiereId: filiereId || undefined, salleId: salleId || undefined };

  const download = async (kind: "pdf-portrait" | "pdf-paysage" | "csv") => {
    setDownloading(kind);
    setProgress((prev) => ({ ...prev, [kind]: 0 }));
    setError(null);
    try {
      const onProgress = (pct: number) => {
        setProgress((prev) => ({ ...prev, [kind]: pct }));
      };
      if (kind === "csv") await apiDownloadCsv(exportParams, onProgress);
      else await apiDownloadPdf({ ...exportParams, orientation: kind === "pdf-paysage" ? "paysage" : "portrait" }, onProgress);
      setProgress((prev) => ({ ...prev, [kind]: 100 }));

      // Enregistrer dans l'historique
      const entry: ExportHistoryEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
        date: new Date().toISOString(),
        format: kind === "csv" ? "CSV" : kind === "pdf-paysage" ? "PDF Paysage" : "PDF Portrait",
        semestre: formatLabel(semestres, semestreId),
        niveau: formatLabel(niveaux, niveauId),
        filiere: formatLabel(filieresDuNiveau, filiereId),
        salle: formatLabel(salles, salleId),
      };
      setHistory((prev) => [entry, ...prev]);

      doneTimerRef.current = setTimeout(() => setDownloading(null), 400);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors du téléchargement");
      setDownloading(null);
    }
  };

  const publicUrl = useMemo(() => {
    const base = `${window.location.origin}/edt`;
    const q = new URLSearchParams();
    if (niveauId) {
      const n = niveaux.find((x) => x.id === niveauId);
      if (n) q.set("niveau", n.libelle);
    }
    if (filiereId) {
      const f = filieresDuNiveau.find((x) => x.id === filiereId);
      if (f) q.set("filiere", f.libelle);
    }
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  }, [niveauId, filiereId, niveaux, filieresDuNiveau]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublication = async () => {
    if (!semestreId || !semestreActuel) return;
    setStatusMsg(null);
    try {
      if (semestreActuel.statut === "publie") {
        await apiDepublierSemestre(semestreId);
        setStatusMsg("Semestre dépublié.");
      } else {
        await apiPublierSemestre(semestreId);
        setStatusMsg("Semestre publié.");
      }
      await refresh();
    } catch (e: any) {
      setStatusMsg(e.message ?? "Erreur lors de la publication");
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Export & publication</h1>

      <Card>
        <CardHeader title="Filtres d'export" />
        <CardBody className="grid gap-3 sm:grid-cols-4">
          <select value={semestreId} onChange={(e) => setSemestreId(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            {semestres.map((s) => <option key={s.id} value={s.id}>{s.libelle} ({s.annee})</option>)}
          </select>
          <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            <option value="">Tous niveaux</option>
            {niveaux.map((n) => <option key={n.id} value={n.id}>{n.libelle}</option>)}
          </select>
          <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)} disabled={!niveauId} className="h-11 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            <option value="">Toutes filières</option>
            {filieresDuNiveau.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
          </select>
          <select value={salleId} onChange={(e) => setSalleId(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            <option value="">Toutes salles</option>
            {salles.map((s) => <option key={s.id} value={s.id}>{s.numero}</option>)}
          </select>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Aperçu avant export"
          subtitle={semestreActuel ? `${semestreActuel.libelle} — ${semestreActuel.annee} — ${slots.length} créneau${slots.length > 1 ? "x" : ""}` : ""}
        />
        <CardBody>
          {loading ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <WeeklyGrid slots={slots} />
          )}
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody className="space-y-3">
            <FileText className="h-7 w-7 text-emit-navy" />
            <div>
              <h3 className="text-sm font-semibold dark:text-slate-100">PDF A4 Portrait</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Compact — idéal affichage mural</p>
            </div>
            {downloading === "pdf-portrait" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-emit-navy dark:text-emit-sky">Téléchargement…</span>
                  <span className="font-bold text-emit-navy dark:text-emit-sky">{progress["pdf-portrait"] ?? 0}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emit-navy to-emit-sky transition-all duration-300 ease-out"
                    style={{ width: `${progress["pdf-portrait"] ?? 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button fullWidth leftIcon={<Download className="h-4 w-4" />} disabled={downloading !== null} onClick={() => download("pdf-portrait")}>
                Télécharger
              </Button>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <FileText className="h-7 w-7 text-emit-blue" />
            <div>
              <h3 className="text-sm font-semibold dark:text-slate-100">PDF A4 Paysage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Planning détaillé</p>
            </div>
            {downloading === "pdf-paysage" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-emit-blue">Téléchargement…</span>
                  <span className="font-bold text-emit-blue">{progress["pdf-paysage"] ?? 0}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
                    style={{ width: `${progress["pdf-paysage"] ?? 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button fullWidth leftIcon={<Download className="h-4 w-4" />} disabled={downloading !== null} onClick={() => download("pdf-paysage")}>
                Télécharger
              </Button>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <FileSpreadsheet className="h-7 w-7 text-green-600" />
            <div>
              <h3 className="text-sm font-semibold dark:text-slate-100">CSV / Excel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Données brutes</p>
            </div>
            {downloading === "csv" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-green-600">Téléchargement…</span>
                  <span className="font-bold text-green-600">{progress["csv"] ?? 0}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300 ease-out"
                    style={{ width: `${progress["csv"] ?? 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button fullWidth variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled={downloading !== null} onClick={() => download("csv")}>
                Télécharger
              </Button>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Lien public partageable" />
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <Link2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <code className="flex-1 truncate text-xs text-slate-700 dark:text-slate-300">{publicUrl}</code>
            <Button size="sm" variant="outline" onClick={copyLink} leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : undefined}>
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Statut de publication" />
        <CardBody className="flex items-center justify-between">
          <div className="space-y-1">
            <Badge tone={semestreActuel?.statut === "publie" ? "green" : "gray"}>
              {semestreActuel?.statut === "publie" ? "Publié" : "Brouillon"}
            </Badge>
            {semestreActuel?.datePublication && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dernière publication : {new Date(semestreActuel.datePublication).toLocaleString("fr-FR")}
              </p>
            )}
            {statusMsg && <p className="text-xs text-slate-500">{statusMsg}</p>}
          </div>
          <div className="flex gap-2">
            {semestreActuel?.statut === "publie" ? (
              <Button variant="outline" onClick={togglePublication}>Dépublier</Button>
            ) : (
              <Button leftIcon={<Upload className="h-4 w-4" />} onClick={togglePublication}>Publier</Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ══════════════════════════════════════════════════════
          HISTORIQUE DES EXPORTS
      ══════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader
          title="Historique des exports"
          subtitle={history.length > 0 ? `${history.length} export${history.length > 1 ? "s" : ""} — les ${MAX_HISTORY} plus récents` : undefined}
          action={
            history.length > 0 && (
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem(HISTORY_KEY);
                }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Effacer
              </button>
            )
          }
        />
        <CardBody className="p-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <HistoryIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucun export pour le moment</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Les exports PDF et CSV que vous téléchargez apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Date</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Format</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Semestre</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Niveau</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Filière</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Salle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {history.map((h) => (
                    <tr
                      key={h.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                        {new Date(h.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={h.format.startsWith("PDF") ? "blue" : "green"}>
                          {h.format}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{h.semestre}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{h.niveau}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{h.filiere}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{h.salle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}