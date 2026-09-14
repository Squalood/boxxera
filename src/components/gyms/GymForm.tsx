"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Field";

type Option = { id: string; name: string };

export function GymForm({
  gymId,
  initial,
  cities,
  commissions
}: {
  gymId?: string;
  initial?: {
    name: string; cityId: string; address: string; phone: string; email: string;
    headCoach: string; responsibleName: string; description: string; commissionId: string;
  };
  cities: Option[];
  commissions: Option[];
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: initial?.name ?? "",
    cityId: initial?.cityId ?? (cities[0]?.id ?? ""),
    address: initial?.address ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    headCoach: initial?.headCoach ?? "",
    responsibleName: initial?.responsibleName ?? "",
    description: initial?.description ?? "",
    commissionId: initial?.commissionId ?? ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (values.name.trim().length < 2) {
      setError("Nombre requerido");
      return;
    }
    setSubmitting(true);
    const payload = { ...values, commissionId: values.commissionId || null };
    const res = await fetch(gymId ? `/api/gyms/${gymId}` : "/api/gyms", {
      method: gymId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar.");
      return;
    }
    router.push("/dashboard/gyms");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="name">Nombre del gimnasio</Label>
        <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        <FieldError message={error ?? undefined} />
      </div>
      <div>
        <Label htmlFor="cityId">Ciudad</Label>
        <Select id="cityId" value={values.cityId} onChange={(e) => set("cityId", e.target.value)}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="commissionId">Comisión asociada</Label>
        <Select id="commissionId" value={values.commissionId} onChange={(e) => set("commissionId", e.target.value)}>
          <option value="">Sin asignar</option>
          {commissions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="headCoach">Entrenador principal</Label>
          <Input id="headCoach" value={values.headCoach} onChange={(e) => set("headCoach", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="responsibleName">Responsable</Label>
          <Input id="responsibleName" value={values.responsibleName} onChange={(e) => set("responsibleName", e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" rows={3} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
