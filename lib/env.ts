export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://rece.marketingterritoriale.com";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !isSupabaseConfigured;

export function requireServerEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variabile ambiente mancante: ${name}`);
  return value;
}
