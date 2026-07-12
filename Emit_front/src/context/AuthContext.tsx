import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
          if (mounted) setUser(appUser);
        } catch (e) {
          // On ne bloque pas l'appli au démarrage, mais on log clairement
          // et on NE connecte PAS l'utilisateur avec un rôle par défaut.
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

    // Le profil doit maintenant se charger correctement, sinon on refuse
    // la connexion plutôt que de connecter avec un mauvais rôle.
    try {
      const appUser = await fetchProfile(data.user);
      setUser(appUser);
      setSession(data.session);
      return { ok: true, role: appUser.role };
    } catch (e) {
      // On déconnecte immédiatement la session Supabase pour éviter un état
      // "authentifié mais sans rôle fiable".
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      const message = e instanceof Error ? e.message : "Erreur inconnue lors du chargement du profil.";
      return { ok: false, error: message };
    }
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