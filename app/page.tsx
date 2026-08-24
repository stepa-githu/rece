import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/auth";

export default async function Home() {
  const context = await getCurrentContext();
  if (!context) redirect("/login");
  redirect(context.profile.role === "platform_admin" ? "/admin" : "/dashboard");
}
