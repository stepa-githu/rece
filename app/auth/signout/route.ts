import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isDemoMode) { const supabase = await createClient(); await supabase.auth.signOut(); }
  return NextResponse.redirect(new URL("/login", request.url));
}
