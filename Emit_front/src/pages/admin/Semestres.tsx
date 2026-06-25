import { useState } from "react";
import { Copy, Archive, Plus } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useData } from "@/context/DataContext";
import { apiCreateSemestre, apiPublierSemestre, apiArchiverSemestre, apiDupliquerSemestre } from "@/lib/api";

const CRENEAUX = [
  "07h30 - 09h00", "09h15 - 10h45", "11h00 - 12h30",
  "13h30 - 15h00", "15h15 - 16h45", "17h00 - 18h30",
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

const statutTone = { brouillon: "orange", publie: "green", archive: "gray" } as const;

export default function AdminSemestres() {
  const { semestres, refresh } = useData();
  const [libelle, setLibelle] = useState("");
  const [annee, setAnnee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!libelle || !annee) return setError("Nom et année académique requis");
    setSaving(true); setError(null);
    try {
      await apiCreateSemestre({ libelle, annee });
      await refresh();
      setLibelle(""); setAnnee("");
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handlePublier = async (id: string) => {
    try { await apiPublierSemestre(id); await refresh(); } catch {}
  };

  const handleArchiver = async (id: string) => {
    try { await apiArchiverSemestre(id); await refresh(); } catch {}
  };

  const handleDupliquer = async (id: string) => {
    try { await apiDupliquerSemestre(id); await refresh(); } catch {}
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Semestres</h1>

      {/* Liste des semestres */}
      {semestres.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun semestre créé.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {semestres.map((s) => (
            <Card key={s.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.libelle}</p>
                    <p className="text-xs text-slate-500">{s.annee}</p>
                  </div>
                  <Badge tone={statutTone[s.statut]}>{s.statut}</Badge>
                </div>
                {s.datePublication && (
                  <p className="mt-3 text-xs text-slate-500">Publié le {s.datePublication}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline" size="sm"
                    leftIcon={<Copy className="h-3.5 w-3.5" />}
                    onClick={() => handleDupliquer(s.id)}
                  >
                    Dupliquer
                  </Button>
                  {s.statut === "brouillon" && (
                    <Button
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => handlePublier(s.id)}
                    >
                      Publier
                    </Button>
                  )}
                  {s.statut === "publie" && (
                    <Button
                      variant="outline" size="sm"
                      leftIcon={<Archive className="h-3.5 w-3.5" />}
                      onClick={() => handleArchiver(s.id)}
                    >
                      Archiver
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire de création */}
      <Card>
        <CardHeader title="Créer un semestre" subtitle="Configuration des créneaux" />
        <CardBody>
          {error && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Nom"
              placeholder="Semestre 2"
              value={libelle}
              onChange={e => setLibelle(e.target.value)}
            />
            <Input
              label="Année académique"
              placeholder="2024-2025"
              value={annee}
              onChange={e => setAnnee(e.target.value)}
            />
            <Input label="Durée d'un créneau (min)" type="number" defaultValue={90} />
            <Input label="Heure de début" type="time" defaultValue="07:30" />
            <Input label="Heure de fin" type="time" defaultValue="18:30" />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Jours ouvrés</p>
            <div className="flex flex-wrap gap-2">
              {JOURS.map((j) => (
                <label key={j} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" defaultChecked /> {j}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Création..." : "Créer le semestre"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Aperçu des créneaux */}
      <Card>
        <CardHeader title="Créneaux générés" subtitle="Aperçu de la grille horaire" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Jour</th>
                  <th className="py-2 pr-3">Créneau</th>
                </tr>
              </thead>
              <tbody>
                {JOURS.flatMap((j) =>
                  CRENEAUX.map((c) => (
                    <tr key={j + c} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-medium">{j}</td>
                      <td className="py-2 pr-3 font-mono text-slate-600">{c}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}