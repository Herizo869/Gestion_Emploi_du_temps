import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Logo from "@/components/Logo";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav(user.role?.toLowerCase() === "admin" ? "/admin/dashboard" : "/enseignant/dashboard", { replace: true });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email || !pwd) return setErr("Veuillez remplir tous les champs");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Email invalide");
    if (pwd.length < 6) return setErr("Mot de passe trop court (min 6 caractères)");
    setLoading(true);
    const r = await login(email, pwd);
    setLoading(false);
    if (!r.ok) return setErr(r.error ?? "Erreur");
    nav(r.role?.toLowerCase() === "admin" ? "/admin/dashboard" : "/enseignant/dashboard", { replace: true });
  };

  const fill = (role: "admin" | "enseignant") => {
    if (role === "admin") { setEmail("admin@emit.mg"); setPwd("admin123"); }
    else { setEmail("herizo@emit.mg"); setPwd("prof123"); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-emit-navy px-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emit-sky/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emit-blue/30 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <Logo />
          <p className="mt-3 text-center text-sm text-slate-500">
            Système de gestion d'emploi du temps
          </p>
        </div>

        {err && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="votre@emit.mg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
          />
          <Input
            id="pwd"
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
          <Button type="submit" fullWidth disabled={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="mb-2 text-center text-[11px] uppercase tracking-wider text-slate-400">
            Accès rapide (dev)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => fill("admin")}>Admin</Button>
            <Button variant="outline" size="sm" onClick={() => fill("enseignant")}>Enseignant</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
