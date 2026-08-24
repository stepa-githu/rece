import { NextResponse } from "next/server";
import { apiError, cleanText, readJson } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await readJson<Record<string, unknown>>(request).catch(() => null);
  if (!body) return apiError("Richiesta non valida.");

  const configuredToken = process.env.SETUP_TOKEN;
  const providedToken = cleanText(body.setupToken, 500);
  if (!configuredToken || providedToken !== configuredToken) {
    return apiError("Codice di configurazione non valido.", 403);
  }

  const fullName = cleanText(body.fullName, 160);
  const email = cleanText(body.email, 320).toLowerCase();
  const password = cleanText(body.password, 200);
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10) {
    return apiError(
      "Completa tutti i campi; la password deve avere almeno 10 caratteri.",
    );
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if ((count || 0) > 0) {
    return apiError("La configurazione iniziale è già stata completata.", 409);
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "platform_admin",
      app_url: appUrl,
    },
  });
  if (authError || !authData.user) {
    return apiError(authError?.message || "Creazione utente non riuscita.", 500);
  }

  return NextResponse.json({ message: "Configurazione completata." });
}
