import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getToken, apiLogin, setToken } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Rôles définis dans public.user_role (enum Supabase) */
export type UserRole = "admin" | "enseignant";

export type AppUser = {
  id: string;
  email: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  email_verified: boolean;
  /** Correspond à public.profiles.role (enum : 'admin' | 'enseignant') */
  role: UserRole;
  // Champs métier optionnels issus de profiles ou user_metadata
  specialite?: string | null;
  statut?: string | null;
  enseignantId?: string | null;
  prenom?: string | null;
  nom?: string | null;
};

type AuthContextType = {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: AppUser | null) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// ─── Helper : décoder le JWT pour extraire les claims ─────────────────────
// Permet de récupérer enseignantId, prenom, nom depuis le token JWT
// (utile après un F5 où l'API n'est pas rappelée)

function decodeJwtClaims(): { enseignantId?: string; role?: string; prenom?: string; nom?: string } {
  try {
    const token = getToken();
    if (!token) return {};
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      enseignantId: decoded.enseignantId as string | undefined,
      role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as string | undefined,
      prenom: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] as string | undefined,
    };
  } catch {
    return {};
  }
}

// ─── Helper : enrichir AppUser avec les claims du JWT ────────────────────
// Utilisé dans getSession et onAuthStateChange (après F5)

function enrichFromJwt(appUser: AppUser) {
  const claims = decodeJwtClaims();
  if (claims.enseignantId) appUser.enseignantId = claims.enseignantId;
  const jwtRole = claims.role?.toLowerCase();
  if (jwtRole === "admin" || jwtRole === "enseignant") {
    appUser.role = jwtRole;
  }
  if (claims.prenom) {
    const parts = claims.prenom.split(" ");
    appUser.prenom = parts[0] ?? null;
    appUser.nom = (parts.slice(1).join(" ") || parts[0]) ?? null;
  }
}

// ─── Helper : charger le profil depuis public.profiles ───────────────────────
//
// La source de vérité du rôle est désormais profiles.role (enum SQL).
// On n'utilise plus user_metadata.role pour le rôle, afin d'éviter qu'un
// utilisateur puisse s'auto-promouvoir admin via l'API client Supabase.

async function fetchProfile(supabaseUser: SupabaseUser): Promise<AppUser> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, username, full_name, avatar_url, role, email_verified")
    .eq("id", supabaseUser.id)
    .single();

  if (error) {
    console.warn("[AuthContext] Impossible de charger le profil :", error.message);
  }

  // Fallback enseignant si le profil est introuvable ou role invalide
  const role: UserRole =
    profile?.role === "admin" ? "admin" : "enseignant";

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? profile?.email ?? "",
    username: profile?.username ?? null,
    full_name:
      profile?.full_name ??
      (supabaseUser.user_metadata?.full_name as string | undefined) ??
      null,
    avatar_url: profile?.avatar_url ?? null,
    email_verified:
      profile?.email_verified ??
      supabaseUser.email_confirmed_at != null,
    role,
    specialite: null,
    statut: null,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Initialisation : session existante + listener temps réel ─────────────

  useEffect(() => {
    let mounted = true;

    // Récupère la session stockée (localStorage Supabase)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const appUser = await fetchProfile(session.user);
        // 🔥 Corriger enseignantId et rôle depuis le JWT (après F5)
        enrichFromJwt(appUser);
        if (mounted) setUser(appUser);
      }
      if (mounted) setLoading(false);
    });

    // Écoute les changements d'état (login / logout / token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setSession(null);
        return;
      }

      setSession(session);
      if (session.user) {
        const appUser = await fetchProfile(session.user);
        enrichFromJwt(appUser);
        if (mounted) setUser(appUser);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; role?: UserRole; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("invalid_credentials")
      ) {
        return { ok: false, error: "Email ou mot de passe incorrect." };
      }
      if (error.message.includes("Email not confirmed")) {
        return {
          ok: false,
          error: "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail.",
        };
      }
      return { ok: false, error: error.message };
    }

    if (!data.user) return { ok: false, error: "Utilisateur introuvable." };

    // 1️⃣ Récupérer le token API C# — si échec, refuser la connexion
    let apiRes: Awaited<ReturnType<typeof apiLogin>> | null = null;
    try {
      apiRes = await apiLogin(email, password);
      setToken(apiRes.token);
    } catch (apiErr) {
      // 🔒 Annuler la session Supabase si le backend C# refuse l'accès
      await supabase.auth.signOut();
      const message = apiErr instanceof Error ? apiErr.message : "Erreur de connexion";

      // Détecter le cas d'un enseignant sans lien dans la table Enseignants
      if (message.includes("compte n'a pas encore été créé") || message.includes("403")) {
        return {
          ok: false,
          error: "Votre compte n'a pas encore été créé ou validé par un administrateur. Veuillez contacter l'administration.",
        };
      }

      return { ok: false, error: message };
    }

    // 2️⃣ Ensuite seulement mettre à jour le user → DataContext.refresh() aura le token
    const appUser = await fetchProfile(data.user);

    // 3️⃣ 🔥 CORRECTION : Utiliser le rôle ET l'enseignantId du backend C#
    //    (la table Users du backend est la source de vérité)
    const apiRole = apiRes.user.role?.toLowerCase();
    if (apiRole === "admin" || apiRole === "enseignant") {
      appUser.role = apiRole;
    }
    // ✅ L'enseignantId (GUID de la table Enseignants) est crucial pour filtrer
    //    les cours, disponibilités et EDT côté frontend
    appUser.enseignantId = apiRes.user.enseignantId ?? null;
    appUser.prenom = apiRes.user.prenom ?? null;
    appUser.nom = apiRes.user.nom ?? null;

    setUser(appUser);
    setSession(data.session);

    return { ok: true, role: appUser.role };
  };



  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    setSession(null);
    window.location.href = "/login";
  };



  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);