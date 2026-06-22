# VolunteerConnect — Build Plan

A full-stack NGO ↔ Volunteer portal per the attached SRS + User Flow. Built in one pass.

## Stack

- TanStack Start + React + Tailwind (existing template)
- Lovable Cloud (Supabase) — auth, Postgres, storage
- Leaflet + OpenStreetMap tiles for maps; Nominatim for geocoding (debounced, server-fn proxied)
- pdf-lib for certificate generation (browser-safe)
- In-app notifications only (bell + dropdown); email deferred

## Design

Warm green/teal palette: `#0F766E` primary, `#14B8A6` accent, `#FBBF24` highlight, `#FFF7ED` background, `#1F2937` text. Rounded-2xl cards, soft shadows, generous whitespace, mobile-first. Friendly nonprofit feel — display font Fraunces, body Inter (via @fontsource).

## Database schema (migration)

Enums: `app_role` (admin, ngo, volunteer), `verification_status` (pending, verified, rejected), `event_status` (published, cancelled, completed), `application_status` (pending, accepted, rejected, waitlisted, cancelled).

Tables (all in `public`, RLS on, grants to authenticated + service_role; selective anon for public reads):

- `profiles` — id (FK auth.users), full_name, phone, pincode, lat, lng, avatar_url, created_at
- `user_roles` — id, user_id, role (separate table per security rules; `has_role()` SECURITY DEFINER fn)
- `volunteer_profiles` — user_id PK, skills text[], availability jsonb, bio
- `ngo_profiles` — user_id PK, org_name, registration_number, registration_cert_url, contact_email, contact_phone, address, pincode, lat, lng, website, description, verification_status, suspended bool
- `events` — id, ngo_id, title, description, category, banner_url, starts_at, ends_at, address, pincode, lat, lng, total_spots, contact_email, contact_phone, status, created_at
- `event_roles` — id, event_id, role_name, spots_needed, spots_filled
- `applications` — id, event_id, volunteer_id, event_role_id, message, status, applied_at, decided_at; unique(event_id, volunteer_id)
- `attendance` — id, application_id PK-unique, attended bool, hours numeric, marked_at
- `certificates` — id, application_id unique, pdf_url, issued_at
- `notifications` — id, user_id, type, title, body, link, read_at, created_at

Storage buckets: `ngo-docs` (private), `event-banners` (public), `avatars` (public), `certificates` (public).

Triggers/functions:

- `handle_new_user()` → inserts into `profiles` + `user_roles` from signup metadata
- `promote_waitlist()` → on application status change from accepted→cancelled, promote oldest waitlisted
- `update_spots_filled()` → maintain event_roles.spots_filled
- `haversine_km(lat1,lng1,lat2,lng2)` SQL fn for distance; events search via RPC `search_events(lat, lng, radius_km, filters...)`

## Routes

- `/` landing (role CTAs, browse preview)
- `/auth` login (role auto-detected)
- `/signup/ngo`, `/signup/volunteer`
- `/browse` public event list (limited; full filters after login)
- `/events/$id` public detail page (contact info gated to logged-in volunteers)
- `/_authenticated/dashboard` → role-routed
- `/_authenticated/volunteer/search` list + map, radius slider, filters
- `/_authenticated/volunteer/applications`
- `/_authenticated/volunteer/certificates`
- `/_authenticated/volunteer/profile`
- `/_authenticated/ngo/events` list + create button
- `/_authenticated/ngo/events/new`, `/ngo/events/$id/edit`
- `/_authenticated/ngo/events/$id/applicants` accept/reject/waitlist + attendance + issue certs
- `/_authenticated/ngo/profile`
- `/_authenticated/admin` simple moderation table (verify NGOs, suspend)

## Key flows

1. **Signup** — separate forms write role into auth metadata; trigger creates profile + role + role-specific profile row. NGO uploads cert to `ngo-docs` (private). Email verification via Supabase default.
2. **Create event** — form geocodes address via Nominatim (server fn proxy w/ user-agent), saves lat/lng, role breakdown rows. Publish = `status=published` immediately.
3. **Search** — RPC returns events within radius from volunteer's saved pincode (geocoded at profile save). Filters: category, date range, skill match (against event_roles.role_name), spots_remaining>0. Toggle list/map (Leaflet markers w/ popups linking to detail).
4. **Apply** — pick role, optional message; insert application (pending). NGO sees applicants with email/phone + computed distance.
5. **Decide** — Accept/Reject/Waitlist updates status; trigger updates spots_filled; notification row created for volunteer.
6. **Cancel accepted** — trigger auto-promotes oldest waitlisted to accepted.
7. **Attendance + certificate** — NGO marks attended + hours; "Issue certificate" server fn renders PDF (pdf-lib), uploads to `certificates` bucket, inserts certificates row, notifies volunteer.
8. **Notifications** — bell in header w/ unread count; realtime subscribe to `notifications` for current user; mark-read on open.
9. **Admin** — `has_role(admin)` gate; list pending NGOs, view cert URL (signed), set verified/rejected, suspend NGOs.

## Security

- RLS: profiles self-rw, public-read of org_name/verification_status only via a `ngo_public` view; events public-read when status=published; applications visible to volunteer (own) + NGO (owner of event); attendance/certificates same; notifications self-only; user_roles never client-writable.
- `has_role()` SECURITY DEFINER for admin gating.
- Storage policies: `ngo-docs` private (admin + owning NGO read); banners/avatars/certificates public read, owner write.
- Server fn for geocoding to avoid leaking user IP / respect Nominatim UA policy.

## Build order

1. Enable Cloud
2. Migration: enums, tables, grants, RLS, triggers, RPC, view
3. Storage buckets + policies
4. Auth pages + role-aware redirect
5. Profile pages (NGO + Volunteer) w/ geocoding
6. NGO event CRUD + role breakdown
7. Public browse + event detail
8. Volunteer search (list + Leaflet map + radius slider + filters)
9. Application flow + applicants view + accept/reject/waitlist
10. Attendance + PDF certificates
11. Notifications (table + realtime bell)
12. Admin moderation page
13. Landing page polish + design system tokens
