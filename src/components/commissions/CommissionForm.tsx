"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";

type Option = { id: string; name: string };

export function CommissionForm({
  commissionId,
  initial,
  cities
}: {
  commissionId?: string;
  initial?: { name: string; shortName: string; cityId: string; jurisdiction: string; contactEmail: string; contactPhone: string };
  cities: Option[];
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: initial?.name ?? "",
    shortName: initial?.shortName ?? "",
    cityId: initial?.cityId ?? (cities[0]?.id ?? ""),
    jurisdiction: initial?.jurisdiction ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactPhone: initial?.contactPhone ?? ""
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
    const res = await fetch(commissionId ? `/api/commissions/${commissionId}` : "/api/commissions", {
      method: commissionId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar.");
      return;
    }
    router.push("/dashboard/commissions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        <FieldError message={error ?? undefined} />
      </div>
      <div>
        <Label htmlFor="shortName">Nombre corto</Label>
        <Input id="shortName" value={values.shortName} onChange={(e) => set("shortName", e.target.value)} />
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
        <Label htmlFor="jurisdiction">Jurisdicción</Label>
        <Input id="jurisdiction" value={values.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} placeholder="Ciudad Juárez, Chihuahua" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactEmail">Correo de contacto</Label>
          <Input id="contactEmail" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contactPhone">Teléfono</Label>
          <Input id="contactPhone" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
