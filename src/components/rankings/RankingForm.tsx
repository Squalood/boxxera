"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { WEIGHT_CLASSES } from "@/types";

type Option = { id: string; name: string };

export function RankingForm({ commissions }: { commissions: Option[] }) {
  const router = useRouter();
  const [values, setValues] = useState({
    commissionId: commissions[0]?.id ?? "",
    weightClass: WEIGHT_CLASSES[0],
    region: "",
    period: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/rankings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, region: values.region || null })
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo crear.");
      return;
    }
    router.push("/dashboard/rankings");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="commissionId">Comisión</Label>
        <Select id="commissionId" value={values.commissionId} onChange={(e) => set("commissionId", e.target.value)}>
          {commissions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="weightClass">Categoría</Label>
        <Select id="weightClass" value={values.weightClass} onChange={(e) => set("weightClass", e.target.value)}>
          {WEIGHT_CLASSES.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="region">Región (opcional)</Label>
        <Input id="region" value={values.region} onChange={(e) => set("region", e.target.value)} placeholder="Zona Norte" />
      </div>
      <div>
        <Label htmlFor="period">Periodo</Label>
        <Input id="period" value={values.period} onChange={(e) => set("period", e.target.value)} />
        <FieldError message={error ?? undefined} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Creando..." : "Crear ranking"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
