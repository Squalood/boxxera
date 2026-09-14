"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const NEXT_STATUS: Record<string, { label: string; status: string; variant: "primary" | "secondary" | "danger" }[]> = {
  DISCOVERED: [{ label: "Sugerir", status: "SUGGESTED", variant: "secondary" }],
  SUGGESTED: [{ label: "Iniciar contacto", status: "CONTACTING", variant: "secondary" }],
  CONTACTING: [{ label: "Pasar a negociación", status: "NEGOTIATING", variant: "secondary" }],
  NEGOTIATING: [
    { label: "Aprobar", status: "APPROVED", variant: "primary" },
    { label: "Rechazar", status: "REJECTED", variant: "danger" }
  ],
  APPROVED: [],
  REJECTED: [],
  CONVERTED_TO_FIGHT: [],
  CANCELLED: []
};

export function OpportunityActions({ opportunityId, status }: { opportunityId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; name: string }[] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState("");

  async function changeStatus(nextStatus: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/opportunities/${opportunityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo actualizar.");
      return;
    }
    router.refresh();
  }

  async function loadEventsForConversion() {
    const res = await fetch("/api/events");
    const list = await res.json();
    setEvents(list.map((e: any) => ({ id: e.id, name: e.name })));
  }

  async function convertToFight() {
    if (!selectedEvent) {
      setError("Selecciona un evento para asociar la pelea.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/opportunities/${opportunityId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEvent })
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo convertir a pelea.");
      return;
    }
    const body = await res.json();
    router.push(`/dashboard/events/${body.fight.eventId}`);
    router.refresh();
  }

  const actions = NEXT_STATUS[status] ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button key={a.status} variant={a.variant} disabled={loading} onClick={() => changeStatus(a.status)}>
            {a.label}
          </Button>
        ))}
        {status === "APPROVED" && (
          <>
            {!events && (
              <Button variant="secondary" disabled={loading} onClick={loadEventsForConversion}>
                Convertir a pelea
              </Button>
            )}
            {events && (
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-ink-600 bg-ink-900 px-2 py-2 text-sm text-ink-100"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="">Selecciona un evento</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <Button disabled={loading} onClick={convertToFight}>Confirmar conversión</Button>
              </div>
            )}
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {actions.length === 0 && status !== "APPROVED" && (
        <p className="text-xs text-ink-500">Esta oportunidad no tiene más transiciones disponibles.</p>
      )}
    </div>
  );
}
