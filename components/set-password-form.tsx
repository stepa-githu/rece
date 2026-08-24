"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [checking, setChecking] = useState(true);
  const [validInvite, setValidInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyInvite() {
      try {
        const supabase = createClient();
        supabaseRef.current = supabase;
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error || !data.session) {
          setMessage("Il link di invito non è valido o è scaduto. Chiedi un nuovo invito.");
          return;
        }
        setValidInvite(true);
      } catch (cause) {
        if (!active) return;
        setMessage(cause instanceof Error ? cause.message : "Invito non verificato.");
      } finally {
        if (active) setChecking(false);
      }
    }

    void verifyInvite();
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");

    if (password.length < 10) {
      setMessage("La password deve avere almeno 10 caratteri.");
      setLoading(false);
      return;
    }
    if (password !== confirmation) {
      setMessage("Le due password non coincidono.");
      setLoading(false);
      return;
    }

    try {
      const supabase = supabaseRef.current;
      if (!supabase || !validInvite) throw new Error("Sessione di invito non disponibile.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setOk(true);
      setMessage("Password impostata. Accesso alla struttura attivato.");
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 900);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Password non aggiornata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {checking && (
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-[#68746e]">
          Verifico il link di invito…
        </p>
      )}
      <label>
        <span className="mb-1.5 block text-sm font-bold">Nuova password</span>
        <input
          autoComplete="new-password"
          className="field"
          minLength={10}
          name="password"
          required
          type="password"
        />
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-bold">Ripeti la password</span>
        <input
          autoComplete="new-password"
          className="field"
          minLength={10}
          name="confirmation"
          required
          type="password"
        />
      </label>
      <button
        className="button-primary w-full"
        disabled={checking || !validInvite || loading || ok}
      >
        {ok ? (
          <>
            <Icon name="check" size={17} /> Accesso attivato
          </>
        ) : loading ? (
          "Salvo…"
        ) : (
          "Imposta password"
        )}
      </button>
      {message && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
