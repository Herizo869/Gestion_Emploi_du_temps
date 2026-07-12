import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";
import AuthSplash from "@/components/AuthSplash";

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const nav = useNavigate();

  // Formulaire
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);

  // États
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Splash post-auth
  const [splash, setSplash] = useState<{ role: UserRole; target: string } | null>(null);

  // Redirection si déjà connecté (session Supabase restaurée au démarrage)
  useEffect(() => {
    if (!authLoading && user) {
      nav(user.role === "admin" ? "/admin/dashboard" : "/enseignant/dashboard", { replace: true });
    }
  }, [user, authLoading, nav]);

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
      return setErr(r.error ?? "Erreur de connexion.");
    }

    // Afficher le splash screen 4s avant redirection
    const target = r.role === "admin" ? "/admin/dashboard" : "/enseignant/dashboard";
    setSplash({ role: r.role!, target });
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

        {/* ── Connexion ── */}
        <>
          <h2 className="mb-5 text-center text-xl font-semibold text-slate-800">
            <LogIn className="mb-1 mr-2 inline-block h-5 w-5 text-emit-blue" />
            Connexion
          </h2>

          {/* Bannière erreur */}
          <ErrorBanner message={err} />

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

          {/* Accès rapide dev */}
          <DevFill onFill={(e, p) => { setEmail(e); setPwd(p); }} />
        </>
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

// Accès rapide pour le développement
// Admin : compte Supabase existant de l'utilisateur
// Enseignant : identifiants du DbSeeder
function DevFill({ onFill }: { onFill: (email: string, pwd: string) => void }) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <p className="mb-2 text-center text-[11px] uppercase tracking-wider text-slate-400">
        Accès rapide (dev)
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          id="dev-admin"
          variant="outline"
          size="sm"
          onClick={() => onFill("miaroandriamanalintsoa007@gmail.com", "Miaroandria007***")}
          title="Compte Admin Supabase"
        >
          Admin
        </Button>
        <Button
          id="dev-teacher"
          variant="outline"
          size="sm"
          onClick={() => onFill("herizo@emit.mg", "Enseignant@123")}
          title="herizo@emit.mg — rôle Enseignant (DbSeeder)"
        >
          Enseignant
        </Button>
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-300">
        Admin : miaroandriamanalintsoa007@gmail.com
      </p>
    </div>
  );
}
