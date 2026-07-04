-- Extend the Data API lockdown to Prisma's bookkeeping table: without RLS,
-- anyone with the publishable key could list migration names/checksums via
-- PostgREST. Prisma connects as the table owner and bypasses RLS unaffected.

alter table public._prisma_migrations enable row level security;
