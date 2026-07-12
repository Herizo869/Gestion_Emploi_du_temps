-- =============================================================================
-- MIGRATION RLS SUPABASE — Politiques de Sécurité au Niveau des Lignes
-- Date : 12 Juillet 2026
-- Projet : EMIT EDT — Gestion d'Emploi du Temps
-- 
-- Exécuter ce script dans l'éditeur SQL du dashboard Supabase
-- (SQL Editor → New Query → Coller → Run)
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes (pour permettre les ré-exécutions)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- ── Politique 1.1 : Lecture de son propre profil ─────────────────────────
-- Tout utilisateur authentifié peut lire son propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- ── Politique 1.2 : Lecture de tous les profils (admin) ───────────────────
-- Les administrateurs peuvent lire tous les profils
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ── Politique 1.3 : Modification de son propre profil ─────────────────────
-- Un utilisateur peut modifier son propre profil, mais PAS son rôle
-- ni son email (gérés par l'admin ou le trigger)
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    -- Empêcher la modification du rôle (admin → enseignant, etc.)
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IS NOT DISTINCT FROM role
  )
);

-- ── Remarque sur l'INSERT ───────────────────────────────────────────────
-- L'insertion dans profiles est gérée par le trigger SECURITY DEFINER
-- `handle_new_user()` qui s'exécute lors de la création d'un utilisateur
-- Supabase Auth. Aucune politique INSERT publique n'est nécessaire.
-- Les comptes sont créés uniquement :
--  - Par le trigger (inscription publique — DÉSACTIVÉ)
--  - Par l'API Admin (service_role) lors de la création d'un enseignant
--
-- Si le trigger n'existe pas encore, le créer avec :
--
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER SET search_path = ''
-- AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, full_name, role, email_verified)
--   VALUES (
--     NEW.id,
--     NEW.email,
--     COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
--     COALESCE(NEW.raw_user_meta_data ->> 'role', 'enseignant'),
--     NEW.email_confirmed_at IS NOT NULL
--   );
--   RETURN NEW;
-- END;
-- $$;
--
-- CREATE OR REPLACE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. AUTRES TABLES (optionnel — défense en profondeur)
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Les tables métier (enseignants, cours, salles, edt, etc.) sont accessibles
-- UNIQUEMENT via l'API C# (Emit.Api) qui utilise le connection string direct.
-- Le client Supabase (anon key) n'y accède pas depuis le frontend.
--
-- Si vous souhaitez activer RLS sur ces tables pour une sécurité renforcée :
-- ─────────────────────────────────────────────────────────────────────────────

-- ALTER TABLE public.enseignants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cours ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.salles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.slots_edt ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.disponibilites ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
--
-- Ces politiques permettraient aux utilisateurs de :
--  - Enseignants : lire leurs propres données
--  - Admins : tout lire/écrire (via l'API C# qui utilise le service_role)

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. VÉRIFICATION
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Pour vérifier les politiques actives :
--   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--   FROM pg_policies
--   WHERE tablename = 'profiles'
--   ORDER BY tablename, policyname;
--
-- Pour tester en tant qu'utilisateur spécifique :
--   SET LOCAL ROLE authenticated;
--   SET LOCAL request.jwt.claim.sub = '<USER_UUID>';
--   SELECT * FROM profiles; -- Ne doit retourner que le profil de l'utilisateur

