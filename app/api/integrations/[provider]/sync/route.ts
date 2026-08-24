import { NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";
import { syncIntegration } from "@/lib/sync";
import type { ReviewProvider } from "@/types";

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403); const { provider } = await params; if (!new Set(["google", "booking", "tripadvisor"]).has(provider)) return apiError("Fonte non valida.");
  if (context.demo) return NextResponse.json({ message: "Sincronizzazione completata: 6 recensioni." });
  try { const result = await syncIntegration(context.hotel.id, provider as ReviewProvider); return NextResponse.json({ message: `Sincronizzazione completata: ${result.count} recensioni.` }); }
  catch (cause) { return apiError(cause instanceof Error ? cause.message : "Sincronizzazione non riuscita.", 422); }
}
