import { AppShell } from "@/components/app-shell";
import { DemoBanner } from "@/components/ui";
import { requireContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const context = await requireContext();
  return <AppShell context={context}>{context.demo && <DemoBanner />}{children}</AppShell>;
}
