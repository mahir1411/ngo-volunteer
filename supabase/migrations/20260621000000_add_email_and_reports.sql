-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Update the handle_new_user function to populate profiles.email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'org_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.email)
  ON CONFLICT (id) DO NOTHING;

  r := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'volunteer')::public.app_role;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r) ON CONFLICT DO NOTHING;

  IF r = 'volunteer' THEN
    INSERT INTO public.volunteer_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSIF r = 'ngo' THEN
    INSERT INTO public.ngo_profiles (user_id, org_name, registration_number, contact_email, contact_phone)
    VALUES (NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'org_name','Unnamed Org'),
      NEW.raw_user_meta_data->>'registration_number',
      NEW.email,
      NEW.raw_user_meta_data->>'phone')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create admin_reports table
CREATE TABLE public.admin_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_entity_type TEXT NOT NULL CHECK (reported_entity_type IN ('ngo', 'event')),
  reported_entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_reports TO authenticated;
GRANT ALL ON public.admin_reports TO service_role;

-- Enable RLS
ALTER TABLE public.admin_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Anyone authenticated can submit/insert a report
CREATE POLICY "reports authenticated insert" ON public.admin_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- 2. Only admins can read or update reports
CREATE POLICY "reports admin read" ON public.admin_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reports admin update" ON public.admin_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reports admin delete" ON public.admin_reports
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
