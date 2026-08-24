import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/ui";
import { getCurrentContext } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export const metadata = { title: "Accedi" };

export default async function LoginPage() {
  const context = await getCurrentContext();
  if (context && !context.demo) redirect("/dashboard");
  return <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-[#17211d] p-12 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[#ec765f]/20 blur-3xl" /><div className="absolute -bottom-36 left-12 h-96 w-96 rounded-full bg-[#2f7a64]/25 blur-3xl" /><Logo inverse /><div className="relative max-w-xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#ef9d8e]">Reputation, fatta bene</p><h1 className="mt-5 text-5xl font-black leading-[1.04] tracking-[-0.055em]">Ogni recensione merita una risposta che sembri davvero tua.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">Google, Booking.com e Tripadvisor in un unico pannello. Rece conosce la struttura e prepara il punto di partenza giusto.</p></div><p className="text-xs text-white/35">rece.marketingterritoriale.it</p></section>
    <section className="flex items-center justify-center px-5 py-10 sm:px-8"><div className="w-full max-w-[430px]"><div className="mb-10 lg:hidden"><Logo /></div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#ec765f]">Bentornato</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Accedi alla tua struttura</h2><p className="mb-8 mt-2 text-sm leading-6 text-[#68746e]">Recensioni, conoscenza e bozze sono al sicuro nel tuo spazio.</p><LoginForm demo={isDemoMode} /></div></section>
  </main>;
}
