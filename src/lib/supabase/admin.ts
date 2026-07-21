import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

/**
 * Cliente Admin (service role). Só use em API routes / server actions.
 * Nunca exponha SUPABASE_SERVICE_ROLE_KEY no browser.
 */
export function createServiceRoleClient() {
  const url = getSupabaseUrl();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return null;
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
