import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { apiUpdateProfile, apiChangePassword } from "@/lib/api";

function strength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function EnsProfil() {
  const { user, setUser } = useAuth();
  const [prenom, setPrenom] = useState(user?.prenom ?? "");
  const [nom, setNom] = useState(user?.nom ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  const s = useMemo(() => strength(newPwd), [newPwd]);
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  const handleSaveProfile = async () => {
    if (!prenom || !nom || !email) return setProfileError("Tous les champs sont requis");
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await apiUpdateProfile({ prenom, nom, email });
      if (setUser && user) {
        setUser({ ...user, ...updated });
      }
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
    } catch (e: any) {
      setProfileError(e.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) return setPwdMsg({ ok: false, text: "Mot de passe trop court (min 6 caractères)" });
    if (newPwd !== confPwd) return setPwdMsg({ ok: false, text: "Les mots de passe ne correspondent pas" });
    if (!oldPwd) return setPwdMsg({ ok: false, text: "Ancien mot de passe requis" });
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const res = await apiChangePassword(oldPwd, newPwd);
      setPwdMsg({ ok: true, text: res.message ?? "Mot de passe modifié avec succès" });
      setOldPwd(""); setNewPwd(""); setConfPwd("");
    } catch (e: any) {
      setPwdMsg({ ok: false, text: e.message ?? "Erreur lors du changement de mot de passe" });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>

      {/* Carte identité */}
      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emit-navy to-emit-sky text-lg font-bold text-white shadow-md">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.prenom} {user?.nom}</p>
            <p className="text-sm text-slate-500">
              {user?.role === "admin" ? "Administrateur" : "Enseignant"} · <Badge tone="green">{user?.statut ?? "Permanent"}</Badge>
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader title="Informations personnelles" />
        <CardBody className="space-y-4">
          {savedProfile && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
              ✓ Profil enregistré avec succès
            </div>
          )}
          {profileError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {profileError}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
            <Input label="Nom" value={nom} onChange={e => setNom(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setPrenom(user?.prenom ?? ""); setNom(user?.nom ?? ""); setEmail(user?.email ?? ""); }}>
              Annuler
            </Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Changement de mot de passe */}
      <Card>
        <CardHeader title="Changer mon mot de passe" />
        <CardBody>
          <form onSubmit={handleChangePwd} className="space-y-4">
            <Input label="Ancien mot de passe" type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
            <Input label="Nouveau mot de passe" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i < s ? colors[s - 1] : "bg-slate-200"}`} />
              ))}
            </div>
            <Input label="Confirmation" type="password" value={confPwd} onChange={e => setConfPwd(e.target.value)} />
            {pwdMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm ${pwdMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {pwdMsg.text}
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={savingPwd}>
                {savingPwd ? "Modification..." : "Modifier le mot de passe"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
