import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/auth";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getApiContext(options?: { admin?: boolean }) {
  const context = await getCurrentContext();
  if (!context) return { context: null, error: apiError("Non autenticato.", 401) };
  if (!context.profile.active) return { context: null, error: apiError("Account disattivato.", 403) };
  if (options?.admin && context.profile.role !== "admin") return { context: null, error: apiError("Permessi insufficienti.", 403) };
  if (!context.hotel && !options?.admin) return { context: null, error: apiError("Nessuna struttura associata.", 403) };
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
