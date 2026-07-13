-- =============================================================================
-- SCRIPT DE CORRECTION COMPLET — SUPABASE
-- Corrige :
-- 1. RLS infinie sur profiles
-- 2. Bucket avatars
-- 3. Compatibilité ENUM user_role / TEXT
-- =============================================================================

-- ============================================================================
-- PARTIE 1 : FONCTIONS SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role::text = 'admin'
);
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
SELECT role::text
FROM public.profiles
WHERE id = auth.uid();
$$;

-- ============================================================================
-- ACTIVER RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUPPRIMER LES ANCIENNES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- ============================================================================
-- NOUVELLES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = id
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
    public.is_admin()
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
    AND public.get_my_role() = role::text
);

-- ============================================================================
-- STORAGE
-- ============================================================================

INSERT INTO storage.buckets
(
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES
(
    'avatars',
    'avatars',
    true,
    2097152,
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ]::text[]
)
ON CONFLICT (id)
DO UPDATE SET
public = EXCLUDED.public,
file_size_limit = EXCLUDED.file_size_limit,
allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- POLICIES STORAGE
-- ============================================================================

DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar own update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar own delete" ON storage.objects;



CREATE POLICY "Avatar public read"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'avatars'
);

CREATE POLICY "Avatar authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND storage.filename(name) LIKE auth.uid()::text || '-%'
);

CREATE POLICY "Avatar own update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND storage.filename(name) LIKE auth.uid()::text || '-%'
)
WITH CHECK (
    bucket_id = 'avatars'
    AND storage.filename(name) LIKE auth.uid()::text || '-%'
);

CREATE POLICY "Avatar own delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND storage.filename(name) LIKE auth.uid()::text || '-%'
);

-- ============================================================================
-- VERIFICATIONS
-- ============================================================================

SELECT
schemaname,
tablename,
policyname,
cmd
FROM pg_policies
WHERE tablename='profiles';

SELECT
id,
name,
public
FROM storage.buckets
WHERE id='avatars';

SELECT
schemaname,
tablename,
policyname,
cmd
FROM pg_policies
WHERE tablename='objects';