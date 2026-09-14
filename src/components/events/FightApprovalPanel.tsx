"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Fight = {
  id: string;
  fighterA: { publicName: string };
  fighterB: { publicName: string };
  status: string;
  commissionStatus: string;
  medicalStatus: string;
  contractStatus: string;
};

export function FightApprovalPanel({ fights }: { fights: Fight[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchFight(id: string, body: Record<string, unknown>) {
    setLoadingId(id);
    setError(null);
    const res = await fetch(`/api/fights/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setLoadingId(null);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo actualizar la pelea.");
      return;
    }
    router.refresh();
  }

  if (fights.length === 0) {
    return <p className="text-sm text-ink-500">Este evento no tiene peleas todavía — conviértelas desde una oportunidad aprobada.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {fights.map((f) => {
        const busy = loadingId === f.id;
        const allApproved = f.commissionStatus === "APPROVED" && f.medicalStatus === "APPROVED" && f.contractStatus === "APPROVED";
        return (
          <div key={f.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-white">{f.fighterA.publicName} vs. {f.fighterB.publicName}</p>
              <span className="text-xs text-ink-400">{f.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <ApprovalToggle label="Comisión" value={f.commissionStatus} disabled={busy}
                onApprove={() => patchFight(f.id, { commissionStatus: "APPROVED" })}
                onReject={() => patchFight(f.id, { commissionStatus: "REJECTED" })} />
              <ApprovalToggle label="Médico" value={f.medicalStatus} disabled={busy}
                onApprove={() => patchFight(f.id, { medicalStatus: "APPROVED" })}
                onReject={() => patchFight(f.id, { medicalStatus: "REJECTED" })} />
              <ApprovalToggle label="Contrato" value={f.contractStatus} disabled={busy}
                onApprove={() => patchFight(f.id, { contractStatus: "APPROVED" })}
                onReject={() => patchFight(f.id, { contractStatus: "REJECTED" })} />
            </div>
            {allApproved && f.status !== "CONFIRMED" && f.status !== "COMPLETED" && (
              <div className="mt-3">
                <Button disabled={busy} onClick={() => patchFight(f.id, { status: "CONFIRMED" })}>
                  Confirmar pelea
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ApprovalToggle({
  label,
  value,
  disabled,
  onApprove,
  onReject
}: {
  label: string;
  value: string;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const color = value === "APPROVED" ? "text-verified-500" : value === "REJECTED" ? "text-red-400" : "text-ink-400";
  return (
    <div className="rounded-md border border-ink-700 p-2 text-center">
      <p className="text-[11px] text-ink-500">{label}</p>
      <p className={`text-xs font-medium ${color}`}>{value}</p>
      <div className="mt-1 flex justify-center gap-1">
        <button disabled={disabled} onClick={onApprove} className="text-[10px] text-verified-500 hover:underline disabled:opacity-40">✓</button>
        <button disabled={disabled} onClick={onReject} className="text-[10px] text-red-400 hover:underline disabled:opacity-40">✕</button>
      </div>
    </div>
  );
}
