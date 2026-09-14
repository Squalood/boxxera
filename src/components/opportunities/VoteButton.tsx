"use client";

import { useState } from "react";

export function VoteButton({ opportunityId, initialCount }: { opportunityId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function vote() {
    if (voted || loading) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/opportunities/${opportunityId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    setLoading(false);
    if (res.status === 409) {
      setVoted(true);
      setError("Ya votaste por esta pelea.");
      return;
    }
    if (!res.ok) {
      setError("No se pudo registrar tu voto.");
      return;
    }
    const body = await res.json();
    setCount(body.voteCount);
    setVoted(true);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={vote}
        disabled={voted || loading}
        className="rounded bg-oxblood-600 px-3 py-1.5 text-xs font-medium text-paper-50 hover:bg-oxblood-700 disabled:cursor-not-allowed disabled:bg-paper-400"
      >
        {voted ? "¡Votado!" : loading ? "Votando..." : "Quiero ver esta pelea"}
      </button>
      <span className="text-xs text-paper-600">{count} voto{count === 1 ? "" : "s"}</span>
      {error && <span className="text-xs text-paper-500">{error}</span>}
    </div>
  );
}
