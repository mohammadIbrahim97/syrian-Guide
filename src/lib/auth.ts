import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// The authenticated user's app profile, or null if not signed in.
// Role is read fresh from the DB on every call (no JWT staleness).
// cache() dedupes per request: pages and the nav both call this.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    // Infrastructure failure (e.g. Supabase unreachable) — without this log
    // an outage is indistinguishable from every user being logged out.
    console.error("getUser: Supabase auth error:", error.message);
  }

  if (!user) return null;

  return prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, image: true },
  });
});
