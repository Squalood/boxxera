"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Field";

type Option = { id: string; publicName?: string; name?: string };

export function SponsorshipForm({
  sponsorId,
  fighters,
  events
}: {
  sponsorId: string;
  fighters: Option[];
  events: Option[];
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    program: "",
    fighterId: "",
    eventId: "",
    proposedAmount: "",
    benefits: "",
    notes: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.program.trim()) {
      setError("Describe el programa (a qué le entra el patrocinio).");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/sponsorships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sponsorId,
        program: values.program,
        fighterId: values.fighterId || null,
        eventId: values.eventId || null,
        proposedAmount: values.proposedAmount ? Number(values.proposedAmount) : null,
        benefits: values.benefits || null,
        notes: values.notes || null
      })
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar.");
      return;
    }
    router.refresh();
    setValues({ program: "", fighterId: "", eventId: "", proposedAmount: "", benefits: "", notes: "" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-ink-700 p-4">
      <div>
        <Label htmlFor="program">Programa</Label>
        <Input id="program" value={values.program} onChange={(e) => set("program", e.target.value)} placeholder="Ej. Patrocinio de temporada" />
        <FieldError message={error ?? undefined} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fighterId">Boxeador (opcional)</Label>
          <Select id="fighterId" value={values.fighterId} onChange={(e) => set("fighterId", e.target.value)}>
            <option value="">Sin asignar</option>
            {fighters.map((f) => (
              <option key={f.id} value={f.id}>{f.publicName}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="eventId">Evento (opcional)</Label>
          <Select id="eventId" value={values.eventId} onChange={(e) => set("eventId", e.target.value)}>
            <option value="">Sin asignar</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="proposedAmount">Monto propuesto (MXN)</Label>
        <Input id="proposedAmount" type="number" value={values.proposedAmount} onChange={(e) => set("proposedAmount", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="benefits">Beneficios / contraprestación</Label>
        <Textarea id="benefits" rows={2} value={values.benefits} onChange={(e) => set("benefits", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Agregar al pipeline"}</Button>
    </form>
  );
}
