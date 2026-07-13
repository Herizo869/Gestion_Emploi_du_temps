import { useMemo, useRef, useState } from "react";
import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { supabase, getStorageClient } from "@/lib/supabase";
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
  const [fullName, setFullName] = useState(user?.full_name ?? user?.prenom ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [specialite, setSpecialite] = useState(user?.specialite ?? "");
  const [statut, setStatut] = useState(user?.statut ?? "permanent");

  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);

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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format non supporté. Utilisez JPG, PNG, GIF ou WebP.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image trop volumineuse. Maximum 2 Mo.");
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploadError(null);
    setUploading(true);

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage (bucket "avatars")
      const storage = await getStorageClient();
      const { error: uploadErr } = await storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      // Récupérer l'URL publique
      const { data: urlData } = storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Mettre à jour public.profiles pour que l'avatar persiste après F5
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      // Mettre à jour le contexte utilisateur
      if (setUser) {
        setUser({ ...user, avatar_url: publicUrl });
      }

      setAvatarPreview(null); // Clear preview so avatarSrc uses user?.avatar_url
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
      const updated = await apiUpdateProfile({ prenom: names[0] ?? fullName, nom: names.slice(1).join(" ") || fullName, email });
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

    // ── Validation renforcée (politique Supabase typique) ──────────────────
    if (!oldPwd) return setPwdMsg({ ok: false, text: "Ancien mot de passe requis" });
    if (newPwd.length < 8) return setPwdMsg({ ok: false, text: "Mot de passe trop court (min 8 caractères)" });
    if (!/[A-Z]/.test(newPwd)) return setPwdMsg({ ok: false, text: "Le mot de passe doit contenir au moins une majuscule" });
    if (!/[0-9]/.test(newPwd)) return setPwdMsg({ ok: false, text: "Le mot de passe doit contenir au moins un chiffre" });
    if (!/[^A-Za-z0-9]/.test(newPwd)) return setPwdMsg({ ok: false, text: "Le mot de passe doit contenir au moins un caractère spécial" });
    if (newPwd !== confPwd) return setPwdMsg({ ok: false, text: "Les mots de passe ne correspondent pas" });
    if (newPwd === oldPwd) return setPwdMsg({ ok: false, text: "Le nouveau mot de passe doit être différent de l'ancien" });

    setSavingPwd(true);
    setPwdMsg(null);
    try {
      // 0️⃣ Vérifier / rafraîchir la session Supabase avant l'opération sensible
      const auth = supabase.auth;
      const { data: { session } } = await auth.getSession();
      if (!session) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      // Si le token est sur le point d'expirer (< 1 min), on le rafraîchit
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const margin = 60;
        if (expiresAt - now < margin) {
          try {
            await (auth as any).refreshSession();
          } catch {
            console.warn("[Profil] Refresh session a échoué, tentative de mise à jour directe");
          }
        }
      }

      // 1️⃣ Mettre à jour le mot de passe Supabase Auth (pour le login)
      //    Envoie current_password + password pour respecter la politique
      //    GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD
      const { error: supabaseErr } = await (auth as any).updateUser({
        password: newPwd,
        current_password: oldPwd, // 👈 clé requise par Supabase
      });
      if (supabaseErr) {
        console.error("[Profil] Supabase updateUser error:", supabaseErr);
        throw new Error(supabaseErr.message);
      }

      // 2️⃣ Mettre à jour le mot de passe Backend C# (pour l'API token)
      try {
        const res = await apiChangePassword(oldPwd, newPwd);
        setPwdMsg({ ok: true, text: res.message ?? "Mot de passe modifié avec succès" });
      } catch (backendErr: any) {
        // Le mot de passe Supabase est déjà changé, on avertit juste
        console.warn("[Profil] Backend C# password change failed:", backendErr.message);
        setPwdMsg({
          ok: true,
          text: "Mot de passe modifié avec succès. La synchronisation avec le serveur échouera au prochain login (" + (backendErr.message ?? "erreur inconnue") + ")",
        });
      }
      setOldPwd(""); setNewPwd(""); setConfPwd("");
    } catch (e: any) {
      console.error("[Profil] handleChangePwd error:", e);
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
                {/* Overlay au hover */}
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
              {/* Bouton caméra en bas à droite */}
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
                {user?.role === "admin" ? "Administrateur" : "Enseignant"}
                {" · "}
                <Badge tone="green">{statut === "permanent" ? "Permanent" : statut === "vacataire" ? "Vacataire" : "Invité"}</Badge>
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
            <Input label="Spécialité" value={specialite} onChange={e => setSpecialite(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
              <select value={statut} onChange={e => setStatut(e.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="permanent">Permanent</option>
                <option value="vacataire">Vacataire</option>
                <option value="invite">Invité</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFullName(user?.full_name ?? user?.prenom ?? ""); setEmail(user?.email ?? ""); setSpecialite(user?.specialite ?? ""); setStatut(user?.statut ?? "permanent"); }}>
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
            <Input
              label="Ancien mot de passe"
              type={showOldPwd ? "text" : "password"}
              value={oldPwd}
              onChange={e => setOldPwd(e.target.value)}
              rightIcon={
                <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showOldPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <Input
              label="Nouveau mot de passe"
              type={showNewPwd ? "text" : "password"}
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              rightIcon={
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {/* Barre de force */}
            {newPwd.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i < s ? colors[s - 1] : "bg-slate-200 dark:bg-slate-600"}`} />
                  ))}
                </div>
                {/* Checklist conditions */}
                <div className="space-y-1 text-xs">
                  {[
                    { check: newPwd.length >= 8, label: "Au moins 8 caractères" },
                    { check: /[A-Z]/.test(newPwd), label: "Une lettre majuscule" },
                    { check: /[0-9]/.test(newPwd), label: "Un chiffre" },
                    { check: /[^A-Za-z0-9]/.test(newPwd), label: "Un caractère spécial" },
                  ].map(({ check, label }) => (
                    <p key={label} className={`flex items-center gap-1.5 transition-colors duration-200 ${check ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"}`}>
                      <span className={`text-xs ${check ? "text-green-500" : "text-slate-300"}`}>{check ? "✓" : "○"}</span>
                      {label}
                    </p>
                  ))}
                </div>
              </>
            )}
            <Input
              label="Confirmation"
              type={showConfPwd ? "text" : "password"}
              value={confPwd}
              onChange={e => setConfPwd(e.target.value)}
              rightIcon={
                <button type="button" onClick={() => setShowConfPwd(!showConfPwd)} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showConfPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {/* Indicateur de correspondance */}
            {confPwd.length > 0 && (
              <p className={`flex items-center gap-1 text-xs transition-all duration-200 ${
                newPwd === confPwd ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
              }`}>
                <span>{newPwd === confPwd ? "✓" : "✗"}</span>
                {newPwd === confPwd ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
              </p>
            )}
            {pwdMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm transition-all duration-300 ${pwdMsg.ok ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800" : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"}`}>
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
