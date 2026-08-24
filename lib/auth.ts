import { redirect } from "next/navigation";
import { demoContext } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AppContext } from "@/types";

export async function getCurrentContext(): Promise<AppContext | null> {
  if (isDemoMode) return demoContext;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, hotel_id, full_name, email, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active) return null;

  let hotel = null;
  if (profile.hotel_id) {
    const { data } = await supabase
      .from("hotels")
      .select(
        "id, name, slug, official_site_url, default_language, timezone, active, created_at",
      )
      .eq("id", profile.hotel_id)
      .maybeSingle();
    hotel = data;
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profile as AppContext["profile"],
    hotel: hotel as AppContext["hotel"],
    demo: false,
  };
}

export async function requireContext() {
  const context = await getCurrentContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireAdmin() {
  const context = await requireContext();
  if (context.profile.role !== "admin") redirect("/dashboard");
  return context;
}
