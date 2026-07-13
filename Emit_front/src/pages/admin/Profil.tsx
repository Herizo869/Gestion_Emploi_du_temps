import { useMemo, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { apiUpdateProfile, apiChangePassword } from "@/lib/api";
import { supabase, getStorageClient } from "@/lib/supabase";

function strength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function AdminProfil() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? user?.prenom ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  // ── Avatar upload ─────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const s = useMemo(() => strength(newPwd), [newPwd]);
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  const initials = useMemo(() => {
    const name = fullName || user?.full_name || user?.email || "?";
    return name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  }, [fullName, user]);

  const avatarSrc = avatarPreview || user?.avatar_url || null;
  const displayName = fullName || user?.full_name || user?.email?.split("@")[0] || "";

  // ── Upload handler ─────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format non supporté. Utilisez JPG, PNG, GIF ou WebP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image trop volumineuse. Maximum 2 Mo.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploadError(null);
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload avec token de session (évite RLS "new row violates policy")
      const storage = await getStorageClient();
      const { error: uploadErr } = await storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Mettre à jour public.profiles
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (setUser) {
        setUser({ ...user, avatar_url: publicUrl });
      }

      setAvatarPreview(null);
    } catch (err: any) {
      setUploadError(err.message ?? "Erreur lors de l'upload");
      setAvatarPreview(null);
    } finally {
      URL.revokeObjectURL(localUrl);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName || !email) return setProfileError("Nom complet et email requis");
    setSavingProfile(true);
    setProfileError(null);
    try {
      const names = fullName.split(" ");
      const updated = await apiUpdateProfile({
        prenom: names[0] ?? fullName,
        nom: names.slice(1).join(" ") || fullName,
        email,
      });
      if (setUser && user) {
        setUser({ ...user, ...updated, full_name: fullName });
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
      // 1️⃣ Mettre à jour le mot de passe Supabase Auth (pour le login)
      const auth = supabase.auth as any;
      const { error: supabaseErr } = await auth.updateUser({ password: newPwd });
      if (supabaseErr) throw new Error(supabaseErr.message);

      // 2️⃣ Mettre à jour le mot de passe Backend C# (pour l'API token)
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

      {/* Carte identité avec avatar */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-5">
            {/* Avatar cliquable */}
            <div className="relative shrink-0">
              <div className="group relative h-20 w-20 overflow-hidden rounded-full">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Photo de profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emit-navy to-emit-sky text-xl font-bold text-white">
                    {initials || "?"}
                  </div>
                )}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-emit-sky text-white shadow-md transition hover:bg-emit-navy disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Infos identité */}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-sm text-slate-500">
                Administrateur
                {" · "}
                <Badge tone="navy">Admin</Badge>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{user?.email}</p>
            </div>

            {/* Upload status */}
            {uploadError && (
              <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {uploadError}
              </div>
            )}
            {uploading && (
              <div className="flex w-full items-center gap-2 text-xs text-emit-sky">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Upload en cours...
              </div>
            )}
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
            <Input label="Nom complet" value={fullName} onChange={e => setFullName(e.target.value)} placeholder={user?.full_name ?? ""} />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFullName(user?.full_name ?? user?.prenom ?? ""); setEmail(user?.email ?? ""); }}>
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
