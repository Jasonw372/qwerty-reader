-- =============================================================
-- Public Article Library + Admin Review
-- Run this in Supabase SQL Editor after the base schema.
-- =============================================================

-- 1. Review metadata on articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'private'
    CHECK (review_status IN ('private', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE public.articles
SET review_status = CASE WHEN is_public THEN 'approved' ELSE 'private' END
WHERE review_status IS NULL
   OR review_status NOT IN ('private', 'pending', 'approved', 'rejected');

CREATE INDEX IF NOT EXISTS idx_articles_review_status ON public.articles(review_status);
CREATE INDEX IF NOT EXISTS idx_articles_public_approved
  ON public.articles(updated_at DESC)
  WHERE is_public = true AND review_status = 'approved';

-- Optional but recommended once the public library grows:
-- keeps paginated public-library reads ordered cheaply and supports title/source search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_articles_public_approved_updated_id
  ON public.articles(updated_at DESC, id)
  WHERE is_public = true AND review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_articles_public_approved_title_trgm
  ON public.articles USING gin (title gin_trgm_ops)
  WHERE is_public = true AND review_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_articles_public_approved_source_trgm
  ON public.articles USING gin (source gin_trgm_ops)
  WHERE is_public = true AND review_status = 'approved' AND source IS NOT NULL;

-- 2. Admin helper
-- Set a user as admin from the SQL editor, replacing the email:
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
-- WHERE email = 'admin@example.com';
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- 3. Tighten article RLS for public library review
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own articles" ON public.articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Users can update own articles" ON public.articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON public.articles;
DROP POLICY IF EXISTS "Articles select own public admin" ON public.articles;
DROP POLICY IF EXISTS "Articles insert own nonpublic" ON public.articles;
DROP POLICY IF EXISTS "Articles update own draft or admin review" ON public.articles;
DROP POLICY IF EXISTS "Articles delete own nonapproved or admin" ON public.articles;

CREATE POLICY "Articles select own public admin"
  ON public.articles FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_public = true AND review_status = 'approved')
    OR public.is_admin()
  );

CREATE POLICY "Articles insert own nonpublic"
  ON public.articles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_public = false
    AND review_status IN ('private', 'pending')
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
  );

CREATE POLICY "Articles update own draft or admin review"
  ON public.articles FOR UPDATE
  USING (
    public.is_admin()
    OR (auth.uid() = user_id AND review_status IN ('private', 'pending', 'rejected'))
  )
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = user_id
      AND is_public = false
      AND review_status IN ('private', 'pending')
      AND reviewed_by IS NULL
    )
  );

CREATE POLICY "Articles delete own nonapproved or admin"
  ON public.articles FOR DELETE
  USING (
    public.is_admin()
    OR (auth.uid() = user_id AND review_status <> 'approved')
  );
