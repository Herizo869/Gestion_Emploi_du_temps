import { useEffect, useMemo, useState } from "react";
import {
  Bell, BookOpen, AlertTriangle, Clock, MapPin,
  Settings as SettingsIcon, Monitor, Save, RotateCcw,
  CalendarDays, Eye, Shield, Loader2,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
import { apiGetSettings, apiUpdateSettings, type SystemSettingsData } from "@/lib/api";

const NOTIF_LABELS: Record<NotifType, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  planning: { label: "Planning", desc: "Modifications de planning", icon: <CalendarDays className="h-4 w-4" />, color: "bg-red-100 text-red-700" },
  cours: { label: "Cours", desc: "Attribution de cours", icon: <BookOpen className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  salle: { label: "Salles", desc: "Changement de salle", icon: <MapPin className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  conflit: { label: "Conflits", desc: "Alertes de conflit", icon: <AlertTriangle className="h-4 w-4" />, color: "bg-orange-100 text-orange-700" },
  edt: { label: "EDT", desc: "Mise à jour de l'EDT", icon: <Clock className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-700" },
  systeme: { label: "Système", desc: "Notifications système", icon: <SettingsIcon className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
};

export default function AdminParametres() {
  const [prefs, setPrefs] = useState<UserPreferences>(getPreferences);
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // ── Paramètres système (API) ──────────────────────────────
  const [sysSettings, setSysSettings] = useState<SystemSettingsData | null>(null);
  const [sysLoading, setSysLoading] = useState(true);
  const [sysSaving, setSysSaving] = useState(false);
  const [sysError, setSysError] = useState<string | null>(null);

  useEffect(() => {
    apiGetSettings()
      .then(setSysSettings)
      .catch(e => setSysError(e.message))
      .finally(() => setSysLoading(false));
  }, []);

  const handleSysChange = (field: keyof SystemSettingsData, value: any) => {
    if (!sysSettings) return;
    setSysSettings({ ...sysSettings, [field]: value });
  };

  const handleSysSave = async () => {
    if (!sysSettings) return;
    setSysSaving(true);
    setSysError(null);
    try {
      const updated = await apiUpdateSettings(sysSettings);
      setSysSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSysError(e.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSysSaving(false);
    }
  };

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

      {/* ─── Section Admin : Paramètres système ─────────── */}
      {sysLoading ? (
        <Card>
          <CardHeader title="Administration" subtitle="Paramètres système" />
          <CardBody className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-emit-sky" />
            <span className="ml-2 text-sm text-slate-500">Chargement...</span>
          </CardBody>
        </Card>
      ) : sysSettings && (
        <>
          {/* Établissement */}
          <Card>
            <CardHeader title="Établissement" subtitle="Informations générales" />
            <CardBody className="space-y-4">
              <Input
                label="Nom de l'établissement"
                value={sysSettings.etablissementNom}
                onChange={e => handleSysChange("etablissementNom", e.target.value)}
                placeholder="EMIT"
              />
              <Input
                label="Sous-titre / Slogan"
                value={sysSettings.etablissementSousTitre}
                onChange={e => handleSysChange("etablissementSousTitre", e.target.value)}
                placeholder="Établissement de Management et des Technologies de l'Information"
              />
            </CardBody>
          </Card>

          {/* Email / SMTP */}
          <Card>
            <CardHeader title="Email / SMTP" subtitle="Configuration des emails sortants" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <button
                  onClick={() => handleSysChange("emailEnabled", !sysSettings.emailEnabled)}
                  className={`shrink-0 grid h-8 w-14 place-items-center rounded-full transition-all ${
                    sysSettings.emailEnabled ? "bg-emit-sky" : "bg-slate-200"
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    sysSettings.emailEnabled ? "translate-x-3.5" : "-translate-x-3.5"
                  }`} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Activer les emails</p>
                  <p className="text-xs text-slate-500">Envoyer les notifications par email</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Serveur SMTP" value={sysSettings.smtpHost} onChange={e => handleSysChange("smtpHost", e.target.value)} placeholder="smtp.gmail.com" />
                <Input label="Port SMTP" type="number" value={String(sysSettings.smtpPort)} onChange={e => handleSysChange("smtpPort", parseInt(e.target.value) || 587)} />
                <Input label="Utilisateur SMTP" value={sysSettings.smtpUser} onChange={e => handleSysChange("smtpUser", e.target.value)} />
                <Input label="Mot de passe SMTP" type="password" value={sysSettings.smtpPass} onChange={e => handleSysChange("smtpPass", e.target.value)} placeholder="Laisser vide pour ne pas changer" />
                <Input label="Email expéditeur" value={sysSettings.fromEmail} onChange={e => handleSysChange("fromEmail", e.target.value)} placeholder="noreply@emit.mg" />
                <Input label="Nom expéditeur" value={sysSettings.fromName} onChange={e => handleSysChange("fromName", e.target.value)} placeholder="EMIT EDT" />
              </div>
              <Input label="URL de connexion" value={sysSettings.loginUrl} onChange={e => handleSysChange("loginUrl", e.target.value)} placeholder="http://localhost:5173/login" />
            </CardBody>
          </Card>

          {/* Politique mot de passe */}
          <Card>
            <CardHeader title="Politique de mot de passe" subtitle="Règles de sécurité des comptes" />
            <CardBody className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Longueur minimale" type="number" value={String(sysSettings.pwdMinLength)} onChange={e => handleSysChange("pwdMinLength", Math.max(4, parseInt(e.target.value) || 6))} />
              </div>
              <div className="space-y-2">
                {[
                  { key: "pwdRequireUppercase" as const, label: "Exiger une majuscule", desc: "Au moins une lettre majuscule (A-Z)" },
                  { key: "pwdRequireDigit" as const, label: "Exiger un chiffre", desc: "Au moins un chiffre (0-9)" },
                  { key: "pwdRequireSpecial" as const, label: "Exiger un caractère spécial", desc: "Au moins un caractère spécial (!@#$%)" },
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => handleSysChange(key, !sysSettings[key])}
                    className={`flex items-center gap-4 rounded-xl border p-3.5 w-full text-left transition-all ${
                      sysSettings[key]
                        ? "border-emit-sky/30 bg-emit-light/50 ring-1 ring-emit-sky/10"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      sysSettings[key] ? "bg-emit-sky text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Shield className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <div className={`shrink-0 grid h-7 w-12 place-items-center rounded-full transition-all ${
                      sysSettings[key] ? "bg-emit-sky" : "bg-slate-200"
                    }`}>
                      <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                        sysSettings[key] ? "translate-x-3" : "-translate-x-3"
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Bouton sauvegarder */}
          <Card>
            <CardBody className="flex flex-col gap-3">
              {sysError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{sysError}</div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Annuler
                </Button>
                <Button onClick={handleSysSave} disabled={sysSaving}>
                  {sysSaving ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enregistrement...</>
                  ) : "Enregistrer les paramètres"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </>
      )}

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
