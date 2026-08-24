import { Logo } from "@/components/ui";
import { SetupForm } from "@/components/setup-form";

export const metadata = { title: "Prima configurazione" };
export default function SetupPage() {
  return <main className="min-h-screen px-4 py-10 sm:py-16"><div className="mx-auto max-w-xl"><div className="text-center"><Logo /><p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#ec765f]">Prima configurazione</p><h1 className="mt-2 text-3xl font-black tracking-[-0.045em]">Attiva il primo hotel</h1><p className="mt-2 text-sm leading-6 text-[#68746e]">Questa pagina funziona una sola volta. Crea la struttura e il primo amministratore.</p></div><div className="panel mt-8 p-5 sm:p-7"><SetupForm /></div></div></main>;
}
