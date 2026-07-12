import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";

function strength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function EnsProfil() {
  const { user } = useAuth();
  const [savedProfile, setSavedProfile] = useState(false);
  const [old, setOld] = useState("");
  const [pwd, setPwd] = useState("");
  const [conf, setConf] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const s = useMemo(() => strength(pwd), [pwd]);
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  const changePwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) return setPwdMsg({ ok: false, text: "Mot de passe trop court (min 6 caractères)" });
    if (pwd !== conf) return setPwdMsg({ ok: false, text: "Les mots de passe ne correspondent pas" });
    if (!old) return setPwdMsg({ ok: false, text: "Ancien mot de passe requis" });
    setPwdMsg({ ok: true, text: "Mot de passe modifié avec succès" });
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emit-navy text-lg font-bold text-white">
            {(user?.full_name ?? user?.email ?? "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.full_name ?? user?.email?.split("@")[0]}</p>
            <p className="text-sm text-slate-500">Enseignant · <Badge tone="green">{user?.statut ?? "actif"}</Badge></p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Informations personnelles" />
        <CardBody className="space-y-4">
          {savedProfile && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              ✓ Profil enregistré
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom complet" defaultValue={user?.full_name ?? ""} />
            <Input label="Email" type="email" defaultValue={user?.email} />
            <Input label="Spécialité" defaultValue={user?.specialite ?? ""} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
              <select defaultValue={user?.statut ?? "permanent"} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="permanent">permanent</option>
                <option value="vacataire">vacataire</option>
                <option value="invite">invité</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => { setSavedProfile(true); setTimeout(() => setSavedProfile(false), 2000); }}>
              Enregistrer
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Changer mon mot de passe" />
        <CardBody>
          <form onSubmit={changePwd} className="space-y-4">
            <Input label="Ancien mot de passe" type="password" value={old} onChange={(e) => setOld(e.target.value)} />
            <Input label="Nouveau mot de passe" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`h-1.5 rounded-full ${i < s ? colors[s - 1] : "bg-slate-200"}`} />
              ))}
            </div>
            <Input label="Confirmation" type="password" value={conf} onChange={(e) => setConf(e.target.value)} />
            {pwdMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm ${pwdMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {pwdMsg.text}
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit">Modifier le mot de passe</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
