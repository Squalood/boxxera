"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["DISCOVERED", "INTERESTED", "CONTACTED", "NEGOTIATING", "CONFIRMED", "LOST"];

export function SponsorshipStatusControl({ sponsorshipId, status }: { sponsorshipId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(next: string) {
    setLoading(true);
    await fetch(`/api/sponsorships/${sponsorshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      className="rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-ink-100"
      value={status}
      disabled={loading}
      onChange={(e) => update(e.target.value)}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
