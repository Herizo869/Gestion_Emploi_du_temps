import { useEffect, useMemo, useState } from "react";
import { Download, FileText, FileSpreadsheet, Link2, Upload, Check } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import WeeklyGrid from "@/components/WeeklyGrid";
import { useData } from "@/context/DataContext";
import {
  apiEdt, apiDownloadPdf, apiDownloadCsv,
  apiPublierSemestre, apiDepublierSemestre,
} from "@/lib/api";
import type { SlotEDT } from "@/types";

export default function AdminExport() {
  const { semestres, niveaux, salles, refresh } = useData();

  const [semestreId, setSemestreId] = useState("");
  const [niveauId, setNiveauId] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [salleId, setSalleId] = useState("");

  const [slots, setSlots] = useState<SlotEDT[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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
    setError(null);
    try {
      if (kind === "csv") await apiDownloadCsv(exportParams);
      else await apiDownloadPdf({ ...exportParams, orientation: kind === "pdf-paysage" ? "paysage" : "portrait" });
    } catch (e: any) {
      setError(e.message ?? "Erreur lors du téléchargement");
    } finally {
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
      <h1 className="text-2xl font-bold text-slate-900">Export & publication</h1>

      <Card>
        <CardHeader title="Filtres d'export" />
        <CardBody className="grid gap-3 sm:grid-cols-4">
          <select value={semestreId} onChange={(e) => setSemestreId(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm">
            {semestres.map((s) => <option key={s.id} value={s.id}>{s.libelle} ({s.annee})</option>)}
          </select>
          <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">Tous niveaux</option>
            {niveaux.map((n) => <option key={n.id} value={n.id}>{n.libelle}</option>)}
          </select>
          <select value={filiereId} onChange={(e) => setFiliereId(e.target.value)} disabled={!niveauId} className="h-11 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-50">
            <option value="">Toutes filières</option>
            {filieresDuNiveau.map((f) => <option key={f.id} value={f.id}>{f.libelle}</option>)}
          </select>
          <select value={salleId} onChange={(e) => setSalleId(e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm">
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
            <p className="py-6 text-center text-sm text-slate-500">Chargement...</p>
          ) : (
            <WeeklyGrid slots={slots} />
          )}
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody className="space-y-3">
            <FileText className="h-7 w-7 text-emit-navy" />
            <div>
              <h3 className="text-sm font-semibold">PDF A4 Portrait</h3>
              <p className="text-xs text-slate-500">Compact — idéal affichage mural</p>
            </div>
            <Button fullWidth leftIcon={<Download className="h-4 w-4" />} disabled={downloading !== null} onClick={() => download("pdf-portrait")}>
              {downloading === "pdf-portrait" ? "Génération..." : "Télécharger"}
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <FileText className="h-7 w-7 text-emit-blue" />
            <div>
              <h3 className="text-sm font-semibold">PDF A4 Paysage</h3>
              <p className="text-xs text-slate-500">Planning détaillé</p>
            </div>
            <Button fullWidth leftIcon={<Download className="h-4 w-4" />} disabled={downloading !== null} onClick={() => download("pdf-paysage")}>
              {downloading === "pdf-paysage" ? "Génération..." : "Télécharger"}
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <FileSpreadsheet className="h-7 w-7 text-green-600" />
            <div>
              <h3 className="text-sm font-semibold">CSV / Excel</h3>
              <p className="text-xs text-slate-500">Données brutes</p>
            </div>
            <Button fullWidth variant="secondary" leftIcon={<Download className="h-4 w-4" />} disabled={downloading !== null} onClick={() => download("csv")}>
              {downloading === "csv" ? "Génération..." : "Télécharger"}
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Lien public partageable" />
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Link2 className="h-4 w-4 text-slate-500" />
            <code className="flex-1 truncate text-xs text-slate-700">{publicUrl}</code>
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
            <Badge tone={semestreActuel?.statut === "publie" ? "green" : "slate"}>
              {semestreActuel?.statut === "publie" ? "Publié" : "Brouillon"}
            </Badge>
            {semestreActuel?.datePublication && (
              <p className="text-xs text-slate-500">
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
    </div>
  );
}