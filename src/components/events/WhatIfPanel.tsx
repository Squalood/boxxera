"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Badge";

type Scenario = { label: string; revenue: number; cost: number; profit: number; margin: number | null };

export function WhatIfPanel({ eventId }: { eventId: string }) {
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function runStandard() {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/whatif`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ standard: true })
    });
    setLoading(false);
    if (!res.ok) return;
    const body = await res.json();
    setScenarios(body.scenarios);
  }

  return (
    <div>
      <Button variant="secondary" disabled={loading} onClick={runStandard}>
        {loading ? "Calculando..." : "Simular escenarios (base / optimista / conservador)"}
      </Button>
      {scenarios && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {scenarios.map((s) => (
            <Card key={s.label}>
              <p className="text-xs uppercase tracking-wide text-ink-500">{s.label}</p>
              <p className="mt-1 text-sm text-ink-300">Ingreso: ${s.revenue.toLocaleString("es-MX")}</p>
              <p className="text-sm text-ink-300">Costo: ${s.cost.toLocaleString("es-MX")}</p>
              <p className={`text-sm font-medium ${s.profit >= 0 ? "text-verified-500" : "text-red-400"}`}>
                Utilidad: ${s.profit.toLocaleString("es-MX")}
              </p>
              {s.margin != null && <p className="text-xs text-ink-500">Margen: {(s.margin * 100).toFixed(1)}%</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
