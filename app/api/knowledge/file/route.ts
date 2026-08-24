import { NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";
import { htmlToText } from "@/lib/crawler";
import { createAdminClient } from "@/lib/supabase/admin";

const allowed = new Set(["text/plain", "text/markdown", "text/csv", "application/json", "text/html"]);

export async function POST(request: Request) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403);
  const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return apiError("Seleziona un file.");
  if (file.size > 5 * 1024 * 1024) return apiError("Il file supera 5 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase(); const mime = file.type || (extension === "md" ? "text/markdown" : extension === "csv" ? "text/csv" : extension === "json" ? "application/json" : extension === "html" ? "text/html" : "text/plain");
  if (!allowed.has(mime)) return apiError("Formato non supportato. Usa TXT, Markdown, CSV, JSON o HTML.");
  let text = await file.text(); if (mime === "text/html") text = htmlToText(text); if (text.trim().length < 20) return apiError("Il file non contiene abbastanza testo leggibile."); text = text.slice(0, 250_000);
  if (context.demo) return NextResponse.json({ message: "File aggiunto alla conoscenza." });
  const admin = createAdminClient(); const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120); const storagePath = `${context.hotel.id}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await admin.storage.from("knowledge-files").upload(storagePath, file, { contentType: mime, upsert: false }); if (uploadError) return apiError(uploadError.message, 500);
  const { error: insertError } = await admin.from("knowledge_sources").insert({ hotel_id: context.hotel.id, source_type: "file", title: file.name.replace(/\.[^.]+$/, ""), file_name: file.name, storage_path: storagePath, mime_type: mime, extracted_text: text, status: "ready", character_count: text.length });
  if (insertError) { await admin.storage.from("knowledge-files").remove([storagePath]); return apiError(insertError.message, 500); }
  return NextResponse.json({ message: "File aggiunto alla conoscenza." });
}
