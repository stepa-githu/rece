import { NextResponse } from "next/server";
import { apiError, cleanText, getApiContext, readJson } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { context, error } = await getApiContext({ admin: true }); if (error || !context) return error ?? apiError("Non autenticato.", 401);
  const body = await readJson<Record<string, unknown>>(request).catch(() => null); const fullName = cleanText(body?.fullName, 160); const email = cleanText(body?.email, 320).toLowerCase(); const hotelId = cleanText(body?.hotelId, 50); const role = body?.role === "admin" ? "admin" : "hotel_user";
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !hotelId) return apiError("Nome, email e struttura sono obbligatori.");
  if (context.demo) return NextResponse.json({ message: "Invito inviato." });
  const admin = createAdminClient(); const { data: hotel } = await admin.from("hotels").select("id").eq("id", hotelId).maybeSingle(); if (!hotel) return apiError("Struttura non trovata.", 404);
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${appUrl}/auth/callback?next=/dashboard`, data: { full_name: fullName, hotel_id: hotelId, role } });
  if (inviteError) return apiError(inviteError.message, 422); return NextResponse.json({ message: `Invito inviato a ${email}.` });
}
