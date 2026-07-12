-- =============================================================================
-- MIGRATION RLS SUPABASE — Politiques de Sécurité au Niveau des Lignes (CORRIGÉ)
-- Date : 12 Juillet 2026
-- Projet : EMIT EDT — Gestion d'Emploi du Temps
--
-- 🔴 PROBLÈME IDENTIFIÉ : Les anciennes politiques interrogeaient public.profiles
--    depuis l'intérieur de la politique sur profiles, causant une récursion infinie.
-- ✅ SOLUTION : Fonctions SECURITY DEFINER qui contournent RLS.
--
-- Exécuter ce script dans l'éditeur SQL du dashboard Supabase
-- (SQL Editor → New Query → Coller → Run)
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 0. FONCTIONS UTILITAIRES (SECURITY DEFINER → contourne RLS)
-- ═════════════════════════════════════════════════════════════════════════════

-- Vérifie si l'utilisateur connecté est admin (utilisé par les politiques)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Récupère le rôle de l'utilisateur connecté (évite la récursion dans WITH CHECK)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES — Activer RLS
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques (pour permettre la ré-exécution)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- ── Politique 1.1 : Lecture de son propre profil ─────────────────────────
-- Tout utilisateur authentifié peut lire son propre profil
-- (auth.uid() = id est sûr — pas de requête sur profiles)
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- ── Politique 1.2 : Lecture de tous les profils (admin) ───────────────────
-- Les administrateurs peuvent lire tous les profils
-- ✅ Utilise is_admin() (SECURITY DEFINER) → PAS de récursion
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (public.is_admin());

-- ── Politique 1.3 : Modification de son propre profil ─────────────────────
-- Un utilisateur peut modifier son propre profil, mais PAS son rôle
-- ✅ Utilise get_my_role() (SECURITY DEFINER) → PAS de récursion
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND public.get_my_role() IS NOT DISTINCT FROM role
);

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. TRIGGER handle_new_user (à créer si pas déjà fait)
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Si le trigger n'existe pas encore, décommentez les lignes ci-dessous
-- et exécutez-les dans le SQL Editor :
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
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE OR REPLACE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. CRÉER LE PROFIL ADMIN MANQUANT (si pas déjà fait)
-- ═════════════════════════════════════════════════════════════════════════════
--
-- L'admin miaroandriamanalintsoa007@gmail.com n'a pas de ligne dans profiles
-- car son compte a été créé AVANT le trigger. Décommentez pour le créer :
--
-- INSERT INTO public.profiles (id, email, full_name, role, email_verified)
-- SELECT
--   id,
--   email,
--   'Admin',
--   'admin',
--   true
-- FROM auth.users
-- WHERE email = 'miaroandriamanalintsoa007@gmail.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. VÉRIFICATION
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Pour vérifier les politiques actives :
--   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--   FROM pg_policies
--   WHERE tablename = 'profiles'
--   ORDER BY tablename, policyname;
