import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getApiContext(options?: { platformAdmin?: boolean }) {
  const context = await getCurrentContext();
  if (!context) return { context: null, error: apiError("Non autenticato.", 401) };
  if (!context.profile.active) return { context: null, error: apiError("Account disattivato.", 403) };
  if (options?.platformAdmin) {
    if (context.profile.role !== "platform_admin") return { context: null, error: apiError("Permessi insufficienti.", 403) };
    return { context, error: null };
  }
  if (context.profile.role !== "hotel_user" || !context.hotel) return { context: null, error: apiError("Accesso riservato alla struttura.", 403) };
  return { context, error: null };
}

export async function readJson<T>(request: Request): Promise<T> {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Formato richiesta non valido.");
  return request.json() as Promise<T>;
}

export function cleanText(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
