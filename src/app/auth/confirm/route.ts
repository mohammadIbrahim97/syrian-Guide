import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Verifies Supabase auth email links (password recovery, and signup
// confirmation once that is enabled). Supports both link styles:
//  - ?code=…                  default templates (PKCE; verifier lives in a cookie)
//  - ?token_hash=…&type=…     custom templates (works cross-browser)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Resolve `next` and reject anything that escapes our origin. Comparing the
  // parsed origin (rather than string-checking for "/"/"//") is immune to URL
  // normalization tricks like "/\evil.com" or a tab-injected "/\t//evil.com",
  // both of which new URL() would otherwise turn cross-origin.
  const origin = new URL(request.url).origin;
  let safeNext = "/";
  try {
    const target = new URL(searchParams.get("next") ?? "/", origin);
    if (target.origin === origin) safeNext = target.pathname + target.search;
  } catch {
    safeNext = "/";
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }

  return NextResponse.redirect(new URL("/login?error=link-expired", request.url));
}
