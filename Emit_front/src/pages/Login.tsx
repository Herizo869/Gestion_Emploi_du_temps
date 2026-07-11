import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle,
  RefreshCw,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";
import AuthSplash from "@/components/AuthSplash";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "login" | "register" | "verify";

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Login() {
  const { user, loading: authLoading, login, register, resendVerification } = useAuth();
  const nav = useNavigate();

  // Formulaire
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [fullName, setFullName] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // États
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Splash post-auth
  const [splash, setSplash] = useState<{ role: UserRole; target: string } | null>(null);

  // Redirection si déjà connecté (session Supabase restaurée au démarrage)
  useEffect(() => {
    if (!authLoading && user) {
      nav(user.role === "admin" ? "/admin/dashboard" : "/enseignant/dashboard", { replace: true });
    }
  }, [user, authLoading, nav]);

  // Compte à rebours renvoi d'email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Réinitialiser les erreurs quand on change de mode ─────────────────────

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr(null);
    setInfo(null);
    setPwd("");
    setConfirmPwd("");
  };

  // ── Validation commune ────────────────────────────────────────────────────

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Soumettre Connexion ───────────────────────────────────────────────────

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email || !pwd) return setErr("Veuillez remplir tous les champs.");
    if (!validateEmail(email)) return setErr("Adresse email invalide.");
    if (pwd.length < 6) return setErr("Mot de passe trop court (min 6 caractères).");

    setLoading(true);
    const r = await login(email, pwd);
    setLoading(false);

    if (!r.ok) {
      // Si l'email n'est pas confirmé, basculer vers le panneau de vérification
      if (r.error?.includes("confirmé") || r.error?.includes("Email not confirmed")) {
        setMode("verify");
        setResendCooldown(60);
        return;
      }
      return setErr(r.error ?? "Erreur de connexion.");
    }

    // Afficher le splash screen 4s avant redirection
    const target = r.role === "admin" ? "/admin/dashboard" : "/enseignant/dashboard";
    setSplash({ role: r.role!, target });
  };

  // ── Soumettre Inscription ─────────────────────────────────────────────────

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email || !pwd || !confirmPwd) return setErr("Veuillez remplir tous les champs.");
    if (!validateEmail(email)) return setErr("Adresse email invalide.");
    if (pwd.length < 8) return setErr("Le mot de passe doit contenir au moins 8 caractères.");
    if (!/[A-Z]/.test(pwd)) return setErr("Le mot de passe doit contenir au moins une majuscule.");
    if (!/[0-9]/.test(pwd)) return setErr("Le mot de passe doit contenir au moins un chiffre.");
    if (pwd !== confirmPwd) return setErr("Les mots de passe ne correspondent pas.");

    setLoading(true);
    const r = await register(email, pwd, fullName || undefined);
    setLoading(false);

    if (!r.ok) return setErr(r.error ?? "Erreur lors de l'inscription.");

    if (r.needsVerification) {
      setMode("verify");
      setResendCooldown(60);
    } else {
      // Connexion directe (si email confirmation désactivée sur Supabase)
      setInfo("Compte créé avec succès !");
    }
  };

  // ── Renvoyer l'email de vérification ─────────────────────────────────────

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendLoading(true);
    const r = await resendVerification(email);
    setResendLoading(false);
    if (r.ok) {
      setResendCooldown(60);
      setInfo("Email de vérification renvoyé ! Vérifiez votre boîte mail.");
    } else {
      setErr(r.error ?? "Erreur lors de l'envoi.");
    }
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  // Callback stable pour éviter les re-renders du splash
  const handleSplashDone = useCallback(() => {
    if (splash) nav(splash.target, { replace: true });
  }, [splash, nav]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emit-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  // Affichage du splash post-auth
  if (splash) {
    return (
      <AuthSplash
        role={splash.role}
        userName={user?.full_name}
        onDone={handleSplashDone}
      />
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-emit-navy px-4">
      {/* Décor flou d'arrière-plan */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emit-sky/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emit-blue/30 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300">
        {/* En-tête */}
        <div className="mb-6 flex flex-col items-center">
          <Logo />
          <p className="mt-3 text-center text-sm text-slate-500">
            Système de gestion d'emploi du temps
          </p>
        </div>

        {/* ── Mode : Vérification email ── */}
        {mode === "verify" && (
          <VerifyPanel
            email={email}
            info={info}
            err={err}
            resendLoading={resendLoading}
            resendCooldown={resendCooldown}
            onResend={handleResend}
            onBackToLogin={() => switchMode("login")}
          />
        )}

        {/* ── Mode : Connexion ── */}
        {mode === "login" && (
          <>
            <h2 className="mb-5 text-center text-xl font-semibold text-slate-800">
              <LogIn className="mb-1 mr-2 inline-block h-5 w-5 text-emit-blue" />
              Connexion
            </h2>

            {/* Bannière erreur */}
            <ErrorBanner message={err} />
            {info && <SuccessBanner message={info} />}

            <form onSubmit={submitLogin} className="space-y-4">
              <Input
                id="login-email"
                type="email"
                label="Email"
                placeholder="votre@emit.mg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                id="login-pwd"
                type={show ? "text" : "password"}
                label="Mot de passe"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShow(!show)} className="hover:text-slate-600">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <Button
                id="btn-login"
                type="submit"
                fullWidth
                disabled={loading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {loading ? "Connexion en cours…" : "Se connecter"}
              </Button>
            </form>

            {/* Lien vers inscription */}
            <p className="mt-5 text-center text-sm text-slate-500">
              Pas encore de compte ?{" "}
              <button
                id="go-register"
                type="button"
                onClick={() => switchMode("register")}
                className="font-medium text-emit-blue hover:underline"
              >
                Créer un compte
              </button>
            </p>

            {/* Accès rapide dev */}
            <DevFill onFill={(e, p) => { setEmail(e); setPwd(p); }} />
          </>
        )}

        {/* ── Mode : Inscription ── */}
        {mode === "register" && (
          <>
            <h2 className="mb-5 text-center text-xl font-semibold text-slate-800">
              <UserPlus className="mb-1 mr-2 inline-block h-5 w-5 text-emit-blue" />
              Créer un compte
            </h2>

            <ErrorBanner message={err} />

            <form onSubmit={submitRegister} className="space-y-4">
              <Input
                id="reg-fullname"
                type="text"
                label="Nom complet (optionnel)"
                placeholder="Prénom NOM"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
              />
              <Input
                id="reg-email"
                type="email"
                label="Email"
                placeholder="votre@emit.mg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                id="reg-pwd"
                type={show ? "text" : "password"}
                label="Mot de passe"
                placeholder="8 car. min, 1 maj., 1 chiffre"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShow(!show)} className="hover:text-slate-600">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <Input
                id="reg-confirm-pwd"
                type={showConfirm ? "text" : "password"}
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="hover:text-slate-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {/* Indicateur de force du mot de passe */}
              <PasswordStrength password={pwd} />

              <Button
                id="btn-register"
                type="submit"
                fullWidth
                disabled={loading}
                rightIcon={<UserPlus className="h-4 w-4" />}
              >
                {loading ? "Inscription en cours…" : "S'inscrire"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Déjà un compte ?{" "}
              <button
                id="go-login"
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-emit-blue hover:underline"
              >
                Se connecter
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// Panneau de vérification d'email
function VerifyPanel({
  email,
  info,
  err,
  resendLoading,
  resendCooldown,
  onResend,
  onBackToLogin,
}: {
  email: string;
  info: string | null;
  err: string | null;
  resendLoading: boolean;
  resendCooldown: number;
  onResend: () => void;
  onBackToLogin: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Icône animée */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emit-blue/10">
        <Mail className="h-8 w-8 text-emit-blue animate-bounce" />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-slate-800">Vérifiez votre email</h2>
      <p className="mb-1 text-sm text-slate-500">
        Un lien de confirmation a été envoyé à :
      </p>
      <p className="mb-6 font-medium text-slate-700 break-all">{email}</p>

      <div className="mb-4 w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 text-left space-y-1">
        <p className="font-semibold">📬 Étapes à suivre :</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>Ouvrez votre boîte mail</li>
          <li>Cliquez sur le lien de confirmation</li>
          <li>Revenez ici pour vous connecter</li>
        </ol>
      </div>

      {err && <ErrorBanner message={err} />}
      {info && <SuccessBanner message={info} />}

      {/* Bouton renvoi */}
      <button
        id="btn-resend"
        type="button"
        onClick={onResend}
        disabled={resendLoading || resendCooldown > 0}
        className="mb-3 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-emit-blue border border-emit-blue/30 hover:bg-emit-blue/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <RefreshCw className={`h-4 w-4 ${resendLoading ? "animate-spin" : ""}`} />
        {resendCooldown > 0
          ? `Renvoyer dans ${resendCooldown}s`
          : resendLoading
          ? "Envoi en cours…"
          : "Renvoyer l'email de vérification"}
      </button>

      <button
        id="btn-back-login"
        type="button"
        onClick={onBackToLogin}
        className="text-sm text-slate-400 hover:text-slate-600 underline"
      >
        ← Retour à la connexion
      </button>
    </div>
  );
}

// Indicateur visuel de force du mot de passe
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "8 caractères minimum", pass: password.length >= 8 },
    { label: "Une majuscule", pass: /[A-Z]/.test(password) },
    { label: "Un chiffre", pass: /[0-9]/.test(password) },
    { label: "Un caractère spécial", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const strength = passed <= 1 ? "Faible" : passed === 2 ? "Moyen" : passed === 3 ? "Bon" : "Fort";
  const color = passed <= 1 ? "bg-red-400" : passed === 2 ? "bg-orange-400" : passed === 3 ? "bg-yellow-400" : "bg-green-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Force du mot de passe</span>
        <span className={`font-medium ${passed <= 1 ? "text-red-500" : passed === 2 ? "text-orange-500" : passed === 3 ? "text-yellow-600" : "text-green-600"}`}>
          {strength}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passed ? color : "bg-slate-200"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        {checks.map((c) => (
          <span key={c.label} className={c.pass ? "text-green-600" : "text-slate-400"}>
            {c.pass ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Accès rapide pour le développement
// ⚠️  Remplacez les mots de passe ci-dessous par les vrais mots de passe de vos comptes Supabase.
// L'email admin correspond au compte promu via : UPDATE public.profiles SET role='admin' WHERE email='miaroandriamanalintsoa007@gmail.com';
function DevFill({ onFill }: { onFill: (email: string, pwd: string) => void }) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <p className="mb-2 text-center text-[11px] uppercase tracking-wider text-slate-400">
        Accès rapide (dev)
      </p>
      <div className="grid grid-cols-2 gap-2">
        {/* Email admin promu dans Supabase via UPDATE public.profiles SET role='admin' */}
        <Button
          id="dev-admin"
          variant="outline"
          size="sm"
          onClick={() => onFill("miaroandriamanalintsoa007@gmail.com", "")}
          title="miaroandriamanalintsoa007@gmail.com — rôle admin dans public.profiles"
        >
          Admin
        </Button>
        <Button id="dev-teacher" variant="outline" size="sm" onClick={() => onFill("herizo@emit.mg", "Prof1234!")}>
          Enseignant
        </Button>
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-300">
        Admin : miaroandriamanalintsoa007@gmail.com
      </p>
    </div>
  );
}
