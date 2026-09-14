"use client";

import { useState } from "react";

export function MembershipLeadForm() {
  const [values, setValues] = useState({ name: "", phone: "", city: "", gymName: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name || !values.phone) {
      setError("Nombre y teléfono son requeridos.");
      return;
    }
    if (!consent) {
      setError("Necesitamos tu consentimiento para que BOXXERA te contacte.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/public/membership-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, consent })
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo enviar. Intenta de nuevo.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded border border-brass-600/30 bg-brass-600/5 p-4 text-sm text-paper-800">
        Listo — alguien de BOXXERA te va a contactar para completar tu membresía.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Honeypot — hidden from real visitors via CSS, bots fill every field blindly */}
      <input
        type="text"
        name="website"
        value={values.website}
        onChange={(e) => set("website", e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />
      <input
        placeholder="Tu nombre"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        className="rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-900 placeholder:text-paper-500"
      />
      <input
        placeholder="Tu teléfono"
        value={values.phone}
        onChange={(e) => set("phone", e.target.value)}
        className="rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-900 placeholder:text-paper-500"
      />
      <input
        placeholder="Ciudad"
        value={values.city}
        onChange={(e) => set("city", e.target.value)}
        className="rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-900 placeholder:text-paper-500"
      />
      <input
        placeholder="Gimnasio (opcional)"
        value={values.gymName}
        onChange={(e) => set("gymName", e.target.value)}
        className="rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-900 placeholder:text-paper-500"
      />
      <label className="flex items-start gap-2 text-xs text-paper-700 sm:col-span-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Acepto que BOXXERA me contacte para completar mi membresía. Ver{" "}
          <a href="/aviso-de-privacidad" className="underline">
            aviso de privacidad
          </a>{" "}
          (en preparación).
        </span>
      </label>
      {error && <p className="text-xs text-oxblood-600 sm:col-span-2">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-oxblood-600 px-5 py-2.5 text-sm font-medium text-paper-50 hover:bg-oxblood-700 disabled:opacity-60 sm:col-span-2"
      >
        {submitting ? "Enviando..." : "Quiero ser miembro"}
      </button>
    </form>
  );
}
