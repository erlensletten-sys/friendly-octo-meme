"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { btnPrimary } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!response.ok) {
      // Serveren skiller mellom feil passord og for mange forsøk.
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Feil passord.");
      return;
    }
    router.replace(params.get("neste") || "/visningsrom");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-6">
      <div>
        <h1 className="text-base font-semibold">Visningsrom</h1>
        <p className="mt-1 text-xs text-mist-400">
          Skriv passordet for å komme til previewene. Kundelenker krever ikke passord.
        </p>
      </div>
      <input
        type="password"
        autoFocus
        className="field"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Passord"
      />
      {error && <p className="text-xs text-red-300">{error}</p>}
      <button type="submit" className={`${btnPrimary} w-full`} disabled={busy}>
        {busy ? "Sjekker …" : "Logg inn"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
