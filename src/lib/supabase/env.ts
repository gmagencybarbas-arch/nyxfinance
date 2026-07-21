/**
 * Variáveis do Supabase para o cliente.
 * Aceita PUBLISHABLE_KEY (nova) ou ANON_KEY (legada) do dashboard.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (see .env.local.example)."
    );
    return "";
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    console.error(
      "Missing Supabase key. Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
    return "";
  }
  return key;
}
