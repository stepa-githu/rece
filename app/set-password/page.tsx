import { SetPasswordForm } from "@/components/set-password-form";
import { Logo } from "@/components/ui";

export const metadata = { title: "Imposta la password" };

export default function SetPasswordPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <Logo />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#ec765f]">
            Invito struttura
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.045em]">
            Scegli la tua password
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#68746e]">
            Il tuo accesso è collegato esclusivamente alla struttura indicata nell’invito.
          </p>
        </div>
        <div className="panel mt-8 p-5 sm:p-7">
          <SetPasswordForm />
        </div>
      </div>
    </main>
  );
}
