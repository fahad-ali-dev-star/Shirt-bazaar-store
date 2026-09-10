import { createClient } from "@/lib/supabase/server";

/** Require an authenticated Supabase user for protected API routes. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false as const, user: null };
  }

  return { authorized: true as const, user };
}

/** Require an authenticated user whose email is explicitly allow-listed as admin. */
export async function requireAdmin() {
  const { authorized, user } = await requireUser();

  if (!authorized || !user) {
    return { authorized: false as const, user: null };
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const authorizedAdmin =
    !!user.email && adminEmails.includes(user.email.toLowerCase());

  return { authorized: authorizedAdmin, user };
}
