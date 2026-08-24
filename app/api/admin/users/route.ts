import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { context, error } = await getApiContext({ admin: true }); if (error || !context) return error ?? apiError("Non autenticato.", 401);
  const body = await readJson<Record<string, unknown>>(request).catch(() => null); const fullName = cleanText(body?.fullName, 160); const email = cleanText(body?.email, 320).toLowerCase(); const hotelId = cleanText(body?.hotelId, 50); const password = cleanText(body?.password, 200); const role = body?.role === "admin" ? "admin" : "hotel_user";
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !hotelId) return apiError("Nome, email e struttura sono obbligatori.");
  if (password.length < 10) return apiError("La password deve avere almeno 10 caratteri.");
  if (context.demo) return NextResponse.json({ message: "Accesso creato." });
  const admin = createAdminClient(); const { data: hotel } = await admin.from("hotels").select("id").eq("id", hotelId).maybeSingle(); if (!hotel) return apiError("Struttura non trovata.", 404);
  const metadata = { full_name: fullName, hotel_id: hotelId, role };
  const { data: existingProfile, error: profileLookupError } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (profileLookupError) return apiError(profileLookupError.message, 500);

  if (existingProfile) {
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(existingProfile.id, { password, email_confirm: true, user_metadata: metadata });
    if (authUpdateError) return apiError(authUpdateError.message, 422);
    const { error: profileUpdateError } = await admin.from("profiles").update({ full_name: fullName, hotel_id: hotelId, role, active: true }).eq("id", existingProfile.id);
    if (profileUpdateError) return apiError(profileUpdateError.message, 500);
    return NextResponse.json({ message: `Password aggiornata per ${email}.` });
  }

  const { data: authData, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
  if (createError || !authData.user) return apiError(createError?.message || "Utente non creato.", 422);
  const { error: profileError } = await admin.from("profiles").upsert({ id: authData.user.id, hotel_id: hotelId, full_name: fullName, email, role, active: true }, { onConflict: "id" });
  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return apiError(profileError.message, 500);
  }
  return NextResponse.json({ message: `Accesso creato per ${email}.` });
}
