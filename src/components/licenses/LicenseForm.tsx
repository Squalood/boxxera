"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";

type Option = { id: string; name?: string; publicName?: string };

export function LicenseForm({ fighters, commissions }: { fighters: Option[]; commissions: Option[] }) {
  const router = useRouter();
  const [values, setValues] = useState({
    fighterId: fighters[0]?.id ?? "",
    commissionId: commissions[0]?.id ?? "",
    type: "professional",
    licenseNumber: "",
    issuedAt: new Date().toISOString().slice(0, 10),
    expiresAt: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.licenseNumber.trim()) {
      setError("Número de licencia requerido");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, expiresAt: values.expiresAt || null })
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar.");
      return;
    }
    router.push("/dashboard/licenses");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="fighterId">Boxeador</Label>
        <Select id="fighterId" value={values.fighterId} onChange={(e) => set("fighterId", e.target.value)}>
          {fighters.map((f) => (
            <option key={f.id} value={f.id}>{f.publicName}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="commissionId">Comisión emisora</Label>
        <Select id="commissionId" value={values.commissionId} onChange={(e) => set("commissionId", e.target.value)}>
          {commissions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" value={values.type} onChange={(e) => set("type", e.target.value)}>
          <option value="professional">Profesional</option>
          <option value="amateur">Amateur</option>
          <option value="trainer">Entrenador</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="licenseNumber">Número de licencia</Label>
        <Input id="licenseNumber" value={values.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
        <FieldError message={error ?? undefined} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issuedAt">Emitida</Label>
          <Input id="issuedAt" type="date" value={values.issuedAt} onChange={(e) => set("issuedAt", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="expiresAt">Vence</Label>
          <Input id="expiresAt" type="date" value={values.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Crear licencia"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
