import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { context, error } = await getApiContext({ platformAdmin: true });
  if (error || !context) return error ?? apiError("Non autenticato.", 401);

  const body = await readJson<Record<string, unknown>>(request).catch(() => null);
  const name = cleanText(body?.name, 160);
  const site = cleanText(body?.officialSiteUrl, 500) || null;
  const fullName = cleanText(body?.fullName, 160);
  const email = cleanText(body?.email, 320).toLowerCase();

  if (!name || !fullName || !/^\S+@\S+\.\S+$/.test(email)) {
    return apiError("Inserisci struttura, referente e un indirizzo email valido.");
  }
  if (context.demo) {
    return NextResponse.json({ message: "Struttura creata e invito inviato." });
  }

  const admin = createAdminClient();
  let slug = slugify(name);
  const { data: exists } = await admin
    .from("hotels")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (exists) slug = `${slug}-${String(Date.now()).slice(-5)}`;

  const { data: hotel, error: hotelError } = await admin
    .from("hotels")
    .insert({ name, slug, official_site_url: site })
    .select("id")
    .single();
  if (hotelError) return apiError(hotelError.message, 500);

  const [integrationsResult, toneResult] = await Promise.all([
    admin.from("integrations").insert(
      (["google", "booking", "tripadvisor"] as const).map((provider) => ({
        hotel_id: hotel.id,
        provider,
        status: "disconnected",
      })),
    ),
    admin
      .from("tone_profiles")
      .insert({ hotel_id: hotel.id, signature: `Lo staff di ${name}` }),
  ]);

  const initializationError = integrationsResult.error || toneResult.error;
  if (initializationError) {
    await admin.from("hotels").delete().eq("id", hotel.id);
    return apiError(initializationError.message, 500);
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
    data: {
      full_name: fullName,
      hotel_id: hotel.id,
      role: "hotel_user",
    },
  });
  if (inviteError) {
    await admin.from("hotels").delete().eq("id", hotel.id);
    return apiError(`Invito non inviato: ${inviteError.message}`, 422);
  }

  return NextResponse.json({
    message: "Struttura creata. Il referente riceverà l’email per scegliere la password.",
    hotelId: hotel.id,
  });
}
