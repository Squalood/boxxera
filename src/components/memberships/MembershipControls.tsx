"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PENDING", "ACTIVE", "PAST_DUE", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];

export function MembershipControls({ membershipId, status, paymentStatus }: { membershipId: string; status: string; paymentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(body: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/memberships/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-ink-100"
        value={status}
        disabled={loading}
        onChange={(e) => update({ status: e.target.value })}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select
        className="rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-ink-100"
        value={paymentStatus}
        disabled={loading}
        onChange={(e) => update({ paymentStatus: e.target.value, ...(e.target.value === "PAID" ? { lastPaymentDate: new Date().toISOString() } : {}) })}
      >
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
