import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Used in Server Components, Server Actions, and Route Handlers.
// Reads/writes auth via cookies so sessions work with SSR.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore if you have
            // middleware refreshing sessions.
          }
        },
      },
    }
  );
}

// Admin client — SERVICE ROLE KEY, bypasses RLS.
// Only ever import this inside app/api/** route handlers, never in
// anything that ships to the client.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is required but not defined in environment variables. " +
      "Please set it in your .env.local file."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for createAdminClient but not defined in environment variables. " +
      "Please uncomment SUPABASE_SERVICE_ROLE_KEY in your .env.local file and set it to your Supabase service_role secret key."
    );
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );
}
