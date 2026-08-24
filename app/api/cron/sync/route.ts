import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncIntegration } from "@/lib/sync";
import type { ReviewProvider } from "@/types";

export const maxDuration = 300;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET; const provided = request.headers.get("authorization"); if (!expected || provided !== `Bearer ${expected}`) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  const admin = createAdminClient(); const { data, error } = await admin.from("integrations").select("hotel_id, provider").eq("status", "connected"); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results = [] as Array<{ hotelId: string; provider: string; ok: boolean; count?: number; error?: string }>;
  for (const row of data ?? []) { try { const synced = await syncIntegration(row.hotel_id, row.provider as ReviewProvider); results.push({ hotelId: row.hotel_id, provider: row.provider, ok: true, count: synced.count }); } catch (cause) { results.push({ hotelId: row.hotel_id, provider: row.provider, ok: false, error: cause instanceof Error ? cause.message : "Errore" }); } }
  return NextResponse.json({ synced: results.length, results });
}
