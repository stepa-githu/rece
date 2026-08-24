import { NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { googleAuthorizationUrl } from "@/lib/providers/google";

export async function GET(request: Request) {
  const { context, error } = await getApiContext(); if (error || !context?.hotel) return error ?? apiError("Nessuna struttura associata.", 403);
  if (context.demo) return NextResponse.redirect(new URL("/integrations?google=demo", request.url));
  try {
    const state = crypto.randomUUID(); const response = NextResponse.redirect(googleAuthorizationUrl(state));
    response.cookies.set("rece_google_oauth_state", state, { httpOnly: true, secure: appUrl.startsWith("https://"), sameSite: "lax", maxAge: 600, path: "/" }); return response;
  } catch (cause) { return apiError(cause instanceof Error ? cause.message : "Google OAuth non configurato.", 500); }
}
