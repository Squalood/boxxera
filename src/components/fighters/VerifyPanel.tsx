"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Badge";

export function VerifyPanel({
  fighterId,
  currentStatus
}: {
  fighterId: string;
  currentStatus: "VERIFIED" | "PENDING" | "UNVERIFIED" | "REJECTED";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "verify" | "reject") {
    setLoading(true);
    await fetch(`/api/fighters/${fighterId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm text-ink-300">Estado de verificación</p>
        <div className="mt-1"><VerifiedBadge status={currentStatus} /></div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={loading} onClick={() => act("verify")}>
          Verificar
        </Button>
        <Button variant="danger" disabled={loading} onClick={() => act("reject")}>
          Rechazar
        </Button>
      </div>
    </Card>
  );
}
