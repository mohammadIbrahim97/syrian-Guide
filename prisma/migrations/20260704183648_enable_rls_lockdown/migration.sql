-- Lock down the Supabase Data API (PostgREST): enable RLS with no policies on
-- all public tables. The app's Prisma connection runs as the table owner
-- (postgres role), which bypasses RLS — app behavior is unchanged. PostgREST
-- roles (anon, authenticated) are denied all access.

alter table public."User" enable row level security;
alter table public."Guide" enable row level security;
alter table public."AvailabilitySlot" enable row level security;
alter table public."Booking" enable row level security;
