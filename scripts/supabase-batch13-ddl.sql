-- Batch 13 DB update script
-- Run manually in Supabase SQL Editor after reviewing the schema.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS registration_blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_students_reg_blocked
  ON public.students(registration_blocked) WHERE registration_blocked = TRUE;

CREATE INDEX IF NOT EXISTS idx_students_visibility
  ON public.students(leaderboard_visible) WHERE leaderboard_visible = FALSE;

CREATE TABLE IF NOT EXISTS public.guest_registration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name_ar TEXT NOT NULL,
  full_name_en TEXT NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

ALTER TABLE public.guest_registration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit guest request"
  ON public.guest_registration_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin reads guest requests"
  ON public.guest_registration_requests FOR ALL
  USING (auth.jwt() ->> 'email' = 'admin@bahri.edu.sd');

CREATE TABLE IF NOT EXISTS public.admin_users (
  email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  permissions JSONB DEFAULT '{
    "manage_students": true,
    "upload_grades": true,
    "manage_settings": true,
    "manage_admins": false
  }',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by TEXT
);

INSERT INTO public.admin_users (email, display_name, added_by)
VALUES ('admin@bahri.edu.sd', 'المشرف الرئيسي', 'system')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
$$;

DROP POLICY IF EXISTS "Admin full access students" ON public.students;
CREATE POLICY "Admin full access students" ON public.students
  FOR ALL USING (public.is_admin());
