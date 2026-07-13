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
  register: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ ok: boolean; error?: string }>;
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
// La source de vérité du rôle est profiles.role (enum SQL).
// IMPORTANT : cette fonction NE DOIT PLUS retomber silencieusement sur
// "enseignant" en cas d'erreur ou de ligne manquante. Si ça arrivait,
// un compte admin pouvait se retrouver connecté avec le rôle enseignant
// sans aucun message d'erreur visible. On lève désormais une exception
// explicite que l'appelant (login / onAuthStateChange) doit gérer.

class ProfileLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileLoadError";
  }
}

async function fetchProfile(supabaseUser: SupabaseUser): Promise<AppUser> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", supabaseUser.id)
    .single();

  if (error) {
    // Cause fréquente : RLS bloque le SELECT, ou aucune ligne pour cet id.
    console.error("[AuthContext] Échec du chargement du profil :", error.message);
    throw new ProfileLoadError(
      `Impossible de charger votre profil (${error.message}). Vérifiez les policies RLS sur "profiles" ou que la ligne existe.`
    );
  }

  if (!profile) {
    throw new ProfileLoadError("Aucun profil trouvé pour cet utilisateur dans public.profiles.");
  }

  if (profile.role !== "admin" && profile.role !== "enseignant") {
    throw new ProfileLoadError(
      `Rôle invalide ou inattendu dans public.profiles : "${profile.role}". Attendu : "admin" ou "enseignant".`
    );
  }

  const role: UserRole = profile.role;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? profile.email ?? "",
    full_name:
      profile.full_name ??
      (supabaseUser.user_metadata?.full_name as string | undefined) ??
      null,
    email_verified: supabaseUser.email_confirmed_at != null,
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
        try {
          const appUser = await fetchProfile(session.user);
          enrichFromJwt(appUser);
          if (mounted) setUser(appUser);
        } catch (e) {
          console.error("[AuthContext] Session restaurée mais profil invalide :", e);
          if (mounted) setUser(null);
        }
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
        try {
          const appUser = await fetchProfile(session.user);
          enrichFromJwt(appUser);
          if (mounted) setUser(appUser);
        } catch (e) {
          console.error("[AuthContext] Changement d'état mais profil invalide :", e);
          if (mounted) setUser(null);
        }
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

    // 1️⃣ Récupérer le token API C# — si échec, ne PAS signOut Supabase
    //    (sinon un simple décalage de mot de passe entre Supabase et C#
    //     verrouille l'utilisateur dans une boucle infernale)
    let apiRes: Awaited<ReturnType<typeof apiLogin>> | null = null;
    try {
      apiRes = await apiLogin(email, password);
      setToken(apiRes.token);
    } catch (apiErr) {
      const message = apiErr instanceof Error ? apiErr.message : "Erreur de connexion";

      // ⛔ Compte non créé côté C# → on signOut Supabase aussi
      if (message.includes("compte n'a pas encore été créé") || message.includes("403")) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        return {
          ok: false,
          error: "Votre compte n'a pas encore été créé ou validé par un administrateur. Veuillez contacter l'administration.",
        };
      }

      // ⚠️ Mot de passe désynchronisé (C# vs Supabase) ou backend indisponible
      //    → on laisse l'utilisateur se connecter via Supabase seulement
      console.warn("[Auth] Login C# échoué, connexion via Supabase uniquement :", message);

      const appUser = await fetchProfile(data.user);
      setUser(appUser);
      setSession(data.session);
      return { ok: true, role: appUser.role };
    }

    // 2️⃣ Charger le profil depuis Supabase
    const appUser = await fetchProfile(data.user);

    // 3️⃣ Enrichir avec les infos du backend C#
    const apiRole = apiRes.user.role?.toLowerCase();
    if (apiRole === "admin" || apiRole === "enseignant") {
      appUser.role = apiRole;
    }
    appUser.enseignantId = apiRes.user.enseignantId ?? null;
    appUser.prenom = apiRes.user.prenom ?? null;
    appUser.nom = apiRes.user.nom ?? null;

    setUser(appUser);
    setSession(data.session);

    return { ok: true, role: appUser.role };
  };

  // ── Register ──────────────────────────────────────────────────────────────
  //
  // Le trigger on_auth_user_created crée automatiquement une ligne dans
  // public.profiles avec role = 'enseignant' et full_name depuis raw_user_meta_data.

  const register = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ ok: boolean; error?: string; needsVerification?: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // full_name est lu par le trigger handle_new_user() dans raw_user_meta_data
        data: { full_name: fullName ?? "" },
      },
    });

    if (error) {
      if (
        error.message.includes("already registered") ||
        error.message.includes("already been registered") ||
        error.message.includes("User already registered")
      ) {
        return { ok: false, error: "Cet email est déjà utilisé." };
      }
      return { ok: false, error: error.message };
    }

    if (!data.user) return { ok: false, error: "Erreur lors de la création du compte." };

    // Fallback : insérer le profil manuellement si le trigger ne l'a pas fait
    // (le trigger SECURITY DEFINER devrait suffire, mais on sécurise)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email: data.user.email ?? email,
          full_name: fullName ?? "",
          role: "enseignant",
          email_verified: data.user.email_confirmed_at != null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (profileError) {
      console.warn("[AuthContext] Profil non créé par upsert (le trigger l'a peut-être déjà créé) :", profileError.message);
    }

    // needsVerification = true si Supabase requiert une confirmation email
    // (data.session est null dans ce cas)
    const needsVerification = !data.session;
    return { ok: true, needsVerification };
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    window.location.href = "/login";
  };

  // ── Renvoi email de vérification ─────────────────────────────────────────

  const resendVerification = async (
    email: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, register, logout, resendVerification, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);