"use client";

import { useState } from "react";

export function InterestButton({ fighterId, eventId }: { fighterId?: string; eventId?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function express() {
    setState("sending");
    const res = await fetch("/api/sponsor-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fighterId, eventId })
    });
    setState(res.ok ? "sent" : "error");
  }

  return (
    <button
      onClick={express}
      disabled={state === "sending" || state === "sent"}
      className="rounded bg-accent-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-60"
    >
      {state === "sent" ? "Interés enviado" : state === "sending" ? "Enviando..." : "Me interesa"}
    </button>
  );
}
