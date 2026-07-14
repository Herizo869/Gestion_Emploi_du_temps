import { useMemo, useState } from "react";
import {
  Bell, BookOpen, AlertTriangle, Clock, MapPin,
  Settings as SettingsIcon, Monitor, Save, RotateCcw,
  CalendarDays, Eye,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  getPreferences,
  updateNotificationPrefs,
  updateDisplayPrefs,
  resetPreferences,
  type NotifType,
  type UserPreferences,
  type DisplayPrefs,
} from "@/lib/preferences";

const NOTIF_LABELS: Record<NotifType, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  planning: { label: "Planning", desc: "Modifications de planning", icon: <CalendarDays className="h-4 w-4" />, color: "bg-red-100 text-red-700" },
  cours: { label: "Cours", desc: "Attribution de cours", icon: <BookOpen className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  salle: { label: "Salles", desc: "Changement de salle", icon: <MapPin className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  conflit: { label: "Conflits", desc: "Alertes de conflit", icon: <AlertTriangle className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
  edt: { label: "EDT", desc: "Mise à jour de l'EDT", icon: <Clock className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-700" },
  systeme: { label: "Système", desc: "Notifications système", icon: <SettingsIcon className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
};

export default function EnsParametres() {
  const [prefs, setPrefs] = useState<UserPreferences>(getPreferences);
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const activeNotifs = useMemo(() =>
    Object.entries(prefs.notifications).filter(([, v]) => v).length,
    [prefs.notifications]
  );

  const toggleNotif = (key: NotifType) => {
    const updated = updateNotificationPrefs({ [key]: !prefs.notifications[key] });
    setPrefs(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateDisplay = (updates: Partial<DisplayPrefs>) => {
    const updated = updateDisplayPrefs(updates);
    setPrefs(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults = resetPreferences();
    setPrefs(defaults);
    setResetConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        {saved && (
          <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
            <Save className="h-3.5 w-3.5" />
            Préférences sauvegardées
          </div>
        )}
      </div>

      {/* ─── Préférences de notification ─────────────────── */}
      <Card>
        <CardHeader
          title="Notifications"
          subtitle={`${activeNotifs}/6 activées`}
        />
        <CardBody className="space-y-1">
          {(Object.entries(NOTIF_LABELS) as [NotifType, typeof NOTIF_LABELS[NotifType]][]).map(([key, cfg]) => {
            const enabled = prefs.notifications[key];
            return (
              <button
                key={key}
                onClick={() => toggleNotif(key)}
                className={`flex w-full items-center gap-4 rounded-xl border p-3.5 text-left transition-all ${
                  enabled
                    ? "border-emit-sky/30 bg-emit-light/50 ring-1 ring-emit-sky/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cfg.color} shadow-sm`}>
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                    <Badge tone={enabled ? "green" : "gray"}>{enabled ? "Activée" : "Désactivée"}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{cfg.desc}</p>
                </div>
                <div className={`shrink-0 grid h-8 w-14 place-items-center rounded-full transition-all ${
                  enabled ? "bg-emit-sky" : "bg-slate-200"
                }`}>
                  <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    enabled ? "translate-x-3.5" : "-translate-x-3.5"
                  }`} />
                </div>
              </button>
            );
          })}
        </CardBody>
      </Card>

      {/* ─── Préférences d'affichage ─────────────────────── */}
      <Card>
        <CardHeader
          title="Affichage"
          subtitle="Personnalisez votre vue"
        />
        <CardBody className="space-y-5">
          {/* Jours de la semaine */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <CalendarDays className="h-4 w-4 text-emit-sky" />
              Jours affichés dans la semaine
            </label>
            <div className="flex gap-2">
              {([5, 7] as const).map(n => (
                <button
                  key={n}
                  onClick={() => updateDisplay({ weekDays: n })}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                    prefs.affichage.weekDays === n
                      ? "border-emit-sky bg-emit-sky/10 text-emit-navy ring-1 ring-emit-sky/20"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {n} jours
                </button>
              ))}
            </div>
          </div>

          {/* Mode compact */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Eye className="h-4 w-4 text-emit-sky" />
              Mode compact
            </label>
            <button
              onClick={() => updateDisplay({ compactMode: !prefs.affichage.compactMode })}
              className={`flex items-center gap-4 rounded-xl border p-3.5 w-full transition-all ${
                prefs.affichage.compactMode
                  ? "border-emit-sky/30 bg-emit-light/50 ring-1 ring-emit-sky/10"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Vue compacte</p>
                <p className="text-xs text-slate-500">Afficher plus de créneaux sans défilement</p>
              </div>
              <div className={`shrink-0 grid h-8 w-14 place-items-center rounded-full transition-all ${
                prefs.affichage.compactMode ? "bg-emit-sky" : "bg-slate-200"
              }`}>
                <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                  prefs.affichage.compactMode ? "translate-x-3.5" : "-translate-x-3.5"
                }`} />
              </div>
            </button>
          </div>

          {/* Créneaux horaires */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 text-xs font-medium text-slate-600">Début de journée</label>
              <select
                value={prefs.affichage.defaultStartHour}
                onChange={e => updateDisplay({ defaultStartHour: parseInt(e.target.value) })}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {[6, 7, 8, 9, 10].map(h => (
                  <option key={h} value={h}>{h}h00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 text-xs font-medium text-slate-600">Fin de journée</label>
              <select
                value={prefs.affichage.defaultEndHour}
                onChange={e => updateDisplay({ defaultEndHour: parseInt(e.target.value) })}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {[16, 17, 18, 19, 20].map(h => (
                  <option key={h} value={h}>{h}h00</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ─── Réinitialisation ────────────────────────────── */}
      <Card>
        <CardBody>
          {!resetConfirm ? (
            <Button
              variant="outline"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setResetConfirm(true)}
              className="w-full"
            >
              Réinitialiser les paramètres par défaut
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-600">
                Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?
              </p>
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleReset} className="flex-1">
                  Oui, réinitialiser
                </Button>
                <Button variant="outline" onClick={() => setResetConfirm(false)} className="flex-1">
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
