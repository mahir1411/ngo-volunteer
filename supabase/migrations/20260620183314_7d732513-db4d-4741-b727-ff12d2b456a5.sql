
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','ngo','volunteer');
CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.event_status AS ENUM ('published','cancelled','completed');
CREATE TYPE public.application_status AS ENUM ('pending','accepted','rejected','waitlisted','cancelled');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  pincode TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Admins can read all roles
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- ============ VOLUNTEER PROFILES ============
CREATE TABLE public.volunteer_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}',
  availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  bio TEXT,
  events_completed INT NOT NULL DEFAULT 0,
  hours_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_profiles TO authenticated;
GRANT ALL ON public.volunteer_profiles TO service_role;
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vp self all" ON public.volunteer_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- NGOs need to view applicant volunteer info; allow read to authenticated
CREATE POLICY "vp read auth" ON public.volunteer_profiles FOR SELECT TO authenticated USING (true);

-- ============ NGO PROFILES ============
CREATE TABLE public.ngo_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  registration_number TEXT,
  registration_cert_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  pincode TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  website TEXT,
  description TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ngo_profiles TO authenticated;
GRANT SELECT ON public.ngo_profiles TO anon;
GRANT ALL ON public.ngo_profiles TO service_role;
ALTER TABLE public.ngo_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ngo read all" ON public.ngo_profiles FOR SELECT USING (true);
CREATE POLICY "ngo self insert" ON public.ngo_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ngo self update" ON public.ngo_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ngo admin update" ON public.ngo_profiles FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  banner_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  address TEXT NOT NULL,
  pincode TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  total_spots INT NOT NULL DEFAULT 0,
  contact_email TEXT,
  contact_phone TEXT,
  status public.event_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events owner insert" ON public.events FOR INSERT WITH CHECK (auth.uid() = ngo_id AND public.has_role(auth.uid(),'ngo'));
CREATE POLICY "events owner update" ON public.events FOR UPDATE USING (auth.uid() = ngo_id);
CREATE POLICY "events owner delete" ON public.events FOR DELETE USING (auth.uid() = ngo_id);

-- ============ EVENT ROLES ============
CREATE TABLE public.event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  spots_needed INT NOT NULL DEFAULT 1,
  spots_filled INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_roles TO authenticated;
GRANT SELECT ON public.event_roles TO anon;
GRANT ALL ON public.event_roles TO service_role;
ALTER TABLE public.event_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "er public read" ON public.event_roles FOR SELECT USING (true);
CREATE POLICY "er owner write" ON public.event_roles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.ngo_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.ngo_id = auth.uid()));

-- ============ APPLICATIONS ============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_role_id UUID REFERENCES public.event_roles(id) ON DELETE SET NULL,
  message TEXT,
  status public.application_status NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  UNIQUE(event_id, volunteer_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps volunteer read own" ON public.applications FOR SELECT USING (auth.uid() = volunteer_id);
CREATE POLICY "apps ngo read own events" ON public.applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.ngo_id = auth.uid()));
CREATE POLICY "apps volunteer insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = volunteer_id);
CREATE POLICY "apps volunteer update own" ON public.applications FOR UPDATE USING (auth.uid() = volunteer_id);
CREATE POLICY "apps ngo update own events" ON public.applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.ngo_id = auth.uid()));

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT false,
  hours NUMERIC NOT NULL DEFAULT 0,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att read related" ON public.attendance FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.events e ON e.id=a.event_id
    WHERE a.id = application_id AND (a.volunteer_id = auth.uid() OR e.ngo_id = auth.uid())));
CREATE POLICY "att ngo write" ON public.attendance FOR ALL
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.events e ON e.id=a.event_id
    WHERE a.id = application_id AND e.ngo_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a JOIN public.events e ON e.id=a.event_id
    WHERE a.id = application_id AND e.ngo_id = auth.uid()));

-- ============ CERTIFICATES ============
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert read related" ON public.certificates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.events e ON e.id=a.event_id
    WHERE a.id = application_id AND (a.volunteer_id = auth.uid() OR e.ngo_id = auth.uid())));
CREATE POLICY "cert ngo write" ON public.certificates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.events e ON e.id=a.event_id
    WHERE a.id = application_id AND e.ngo_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a JOIN public.events e ON e.id=a.event_id
    WHERE a.id = application_id AND e.ngo_id = auth.uid()));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif self read" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif self update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif insert auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- ============ TRIGGERS ============

-- Auto-create profile + role on user signup based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'org_name', ''),
    NEW.raw_user_meta_data->>'phone')
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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Maintain event_roles.spots_filled when application accepted/cancelled
CREATE OR REPLACE FUNCTION public.handle_application_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  promoted_id UUID;
  v_event_id UUID;
  v_role_id UUID;
BEGIN
  -- Increment when newly accepted
  IF TG_OP = 'UPDATE' AND OLD.status <> 'accepted' AND NEW.status = 'accepted' THEN
    IF NEW.event_role_id IS NOT NULL THEN
      UPDATE public.event_roles SET spots_filled = spots_filled + 1 WHERE id = NEW.event_role_id;
    END IF;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.volunteer_id, 'application_accepted', 'You''re in!', 'Your application was accepted.', '/volunteer/applications');
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status <> 'rejected' AND NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.volunteer_id, 'application_rejected', 'Application update', 'Your application was not selected.', '/volunteer/applications');
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status <> 'waitlisted' AND NEW.status = 'waitlisted' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.volunteer_id, 'application_waitlisted', 'You''re waitlisted', 'You''ll be promoted if a spot opens.', '/volunteer/applications');
  END IF;

  -- Decrement + auto-promote waitlist when an accepted application is cancelled or moved away
  IF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
    IF OLD.event_role_id IS NOT NULL THEN
      UPDATE public.event_roles SET spots_filled = GREATEST(spots_filled - 1, 0) WHERE id = OLD.event_role_id;
    END IF;
    -- Promote oldest waitlisted on same event (prefer same role)
    SELECT id INTO promoted_id FROM public.applications
      WHERE event_id = NEW.event_id AND status = 'waitlisted'
      ORDER BY (event_role_id = OLD.event_role_id) DESC, applied_at ASC LIMIT 1;
    IF promoted_id IS NOT NULL THEN
      UPDATE public.applications SET status = 'accepted', decided_at = now() WHERE id = promoted_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_application_change
AFTER UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.handle_application_change();

-- Notify NGO when new application arrives
CREATE OR REPLACE FUNCTION public.handle_new_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ngo UUID;
  v_title TEXT;
BEGIN
  SELECT ngo_id, title INTO v_ngo, v_title FROM public.events WHERE id = NEW.event_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (v_ngo, 'new_application', 'New volunteer application', 'Someone applied to ' || v_title, '/ngo/events/' || NEW.event_id || '/applicants');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_application
AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.handle_new_application();

-- Update volunteer stats on attendance change
CREATE OR REPLACE FUNCTION public.handle_attendance_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_vol UUID;
BEGIN
  SELECT volunteer_id INTO v_vol FROM public.applications WHERE id = NEW.application_id;
  -- Recompute totals from scratch (simple + correct)
  UPDATE public.volunteer_profiles vp
  SET events_completed = sub.cnt, hours_total = sub.hrs
  FROM (
    SELECT COUNT(*) FILTER (WHERE att.attended) AS cnt, COALESCE(SUM(att.hours) FILTER (WHERE att.attended),0) AS hrs
    FROM public.attendance att JOIN public.applications a ON a.id = att.application_id
    WHERE a.volunteer_id = v_vol
  ) sub
  WHERE vp.user_id = v_vol;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attendance_change
AFTER INSERT OR UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.handle_attendance_change();

-- ============ HAVERSINE + SEARCH RPC ============
CREATE OR REPLACE FUNCTION public.haversine_km(lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION LANGUAGE SQL IMMUTABLE AS $$
  SELECT 2 * 6371 * asin(sqrt(
    sin(radians((lat2-lat1)/2))^2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians((lng2-lng1)/2))^2
  ))
$$;

CREATE OR REPLACE FUNCTION public.search_events(
  _lat DOUBLE PRECISION,
  _lng DOUBLE PRECISION,
  _radius_km DOUBLE PRECISION DEFAULT 10,
  _category TEXT DEFAULT NULL,
  _from TIMESTAMPTZ DEFAULT NULL,
  _to TIMESTAMPTZ DEFAULT NULL,
  _only_open BOOLEAN DEFAULT true
) RETURNS TABLE (
  id UUID, ngo_id UUID, title TEXT, description TEXT, category TEXT, banner_url TEXT,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, address TEXT, pincode TEXT,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION, total_spots INT,
  spots_filled BIGINT, distance_km DOUBLE PRECISION,
  org_name TEXT, verification_status public.verification_status
) LANGUAGE SQL STABLE AS $$
  SELECT e.id, e.ngo_id, e.title, e.description, e.category, e.banner_url,
    e.starts_at, e.ends_at, e.address, e.pincode, e.lat, e.lng, e.total_spots,
    COALESCE((SELECT SUM(spots_filled) FROM public.event_roles WHERE event_id = e.id),0) AS spots_filled,
    CASE WHEN _lat IS NULL OR _lng IS NULL OR e.lat IS NULL OR e.lng IS NULL THEN NULL
         ELSE public.haversine_km(_lat,_lng,e.lat,e.lng) END AS distance_km,
    n.org_name, n.verification_status
  FROM public.events e
  LEFT JOIN public.ngo_profiles n ON n.user_id = e.ngo_id
  WHERE e.status = 'published'
    AND (_category IS NULL OR e.category = _category)
    AND (_from IS NULL OR e.starts_at >= _from)
    AND (_to IS NULL OR e.starts_at <= _to)
    AND (_lat IS NULL OR _lng IS NULL OR e.lat IS NULL OR e.lng IS NULL
         OR public.haversine_km(_lat,_lng,e.lat,e.lng) <= _radius_km)
    AND (NOT _only_open OR e.total_spots = 0 OR
         COALESCE((SELECT SUM(spots_filled) FROM public.event_roles WHERE event_id = e.id),0) < e.total_spots)
  ORDER BY (CASE WHEN _lat IS NULL THEN e.starts_at::TEXT ELSE NULL END),
           distance_km NULLS LAST, e.starts_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.search_events TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.haversine_km TO anon, authenticated;
