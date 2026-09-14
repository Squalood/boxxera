"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";

type Option = { id: string; name: string };

export function EventForm({ commissions }: { commissions: Option[] }) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    date: "",
    city: "",
    venue: "",
    commissionId: commissions[0]?.id ?? "",
    capacity: "",
    expectedAttendance: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name || !values.date || !values.city) {
      setError("Nombre, fecha y ciudad son requeridos.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        commissionId: values.commissionId || null,
        capacity: values.capacity ? Number(values.capacity) : null,
        expectedAttendance: values.expectedAttendance ? Number(values.expectedAttendance) : null
      })
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo crear el evento.");
      return;
    }
    const event = await res.json();
    router.push(`/dashboard/events/${event.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="name">Nombre del evento</Label>
        <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        <FieldError message={error ?? undefined} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="venue">Sede</Label>
        <Input id="venue" value={values.venue} onChange={(e) => set("venue", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="commissionId">Comisión</Label>
        <Select id="commissionId" value={values.commissionId} onChange={(e) => set("commissionId", e.target.value)}>
          <option value="">Sin asignar</option>
          {commissions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="capacity">Capacidad</Label>
          <Input id="capacity" type="number" value={values.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="expectedAttendance">Asistencia esperada</Label>
          <Input id="expectedAttendance" type="number" value={values.expectedAttendance} onChange={(e) => set("expectedAttendance", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Creando..." : "Crear evento"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
