import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// The authenticated user's app profile, or null if not signed in.
// Role is read fresh from the DB on every call (no JWT staleness).
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, image: true },
  });
}
