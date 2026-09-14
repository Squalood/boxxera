"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SUPPORT_REQUEST_TYPES } from "@/lib/config";

type PastRequest = { id: string; title: string; status: string; createdAt: string };

export function SupportPanel({ fighterId, pastRequests }: { fighterId: string; pastRequests: PastRequest[] }) {
  const router = useRouter();
  const [submittingType, setSubmittingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function request(requestType: string) {
    setSubmittingType(requestType);
    setError(null);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fighterId, requestType })
    });
    setSubmittingType(null);
    if (!res.ok) {
      setError("No se pudo enviar tu solicitud.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUPPORT_REQUEST_TYPES.map((t) => (
          <Button
            key={t.value}
            variant="secondary"
            disabled={submittingType === t.value}
            onClick={() => request(t.value)}
            className="justify-start text-left"
          >
            {submittingType === t.value ? "Enviando..." : t.label}
          </Button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {pastRequests.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-500">Tus solicitudes</p>
          <div className="space-y-2">
            {pastRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-ink-700 px-3 py-2 text-sm">
                <span className="text-ink-200">{r.title}</span>
                <span className="text-xs text-ink-500">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
