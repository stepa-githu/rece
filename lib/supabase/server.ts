import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireServerEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const url = requireServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireServerEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // I Server Component non possono sempre aggiornare cookie.
          // Il callback OAuth e le Route Handler coprono i flussi di scrittura.
        }
      },
    },
  });
}
