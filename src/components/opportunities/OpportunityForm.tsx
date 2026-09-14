"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { WEIGHT_CLASSES } from "@/types";

type Option = { id: string; publicName?: string; name?: string };

export function OpportunityForm({
  fighters,
  commissions
}: {
  fighters: Option[];
  commissions: Option[];
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    fighterAId: fighters[0]?.id ?? "",
    fighterBId: fighters[1]?.id ?? "",
    weightClass: WEIGHT_CLASSES[0] as string,
    proposedDate: "",
    proposedCity: "",
    proposedVenue: "",
    commissionId: commissions[0]?.id ?? "",
    allowOverride: false
  });
  const [issues, setIssues] = useState<{ code: string; message: string; blocking: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIssues([]);
    if (values.fighterAId === values.fighterBId) {
      setError("Selecciona dos boxeadores distintos.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        proposedDate: values.proposedDate || null,
        proposedCity: values.proposedCity || null,
        proposedVenue: values.proposedVenue || null,
        commissionId: values.commissionId || null
      })
    });
    setSubmitting(false);

    if (res.status === 422) {
      const body = await res.json();
      setIssues(body.issues ?? []);
      setError(body.error ?? "No pasa las reglas de validación.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo crear la oportunidad.");
      return;
    }
    const body = await res.json();
    router.push(`/dashboard/opportunities/${body.opportunity.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fighterAId">Boxeador A</Label>
          <Select id="fighterAId" value={values.fighterAId} onChange={(e) => set("fighterAId", e.target.value)}>
            {fighters.map((f) => (
              <option key={f.id} value={f.id}>{f.publicName}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fighterBId">Boxeador B</Label>
          <Select id="fighterBId" value={values.fighterBId} onChange={(e) => set("fighterBId", e.target.value)}>
            {fighters.map((f) => (
              <option key={f.id} value={f.id}>{f.publicName}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="weightClass">Categoría</Label>
        <Select id="weightClass" value={values.weightClass} onChange={(e) => set("weightClass", e.target.value)}>
          {WEIGHT_CLASSES.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="proposedDate">Fecha propuesta</Label>
          <Input id="proposedDate" type="date" value={values.proposedDate} onChange={(e) => set("proposedDate", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="proposedCity">Ciudad propuesta</Label>
          <Input id="proposedCity" value={values.proposedCity} onChange={(e) => set("proposedCity", e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="proposedVenue">Sede propuesta</Label>
        <Input id="proposedVenue" value={values.proposedVenue} onChange={(e) => set("proposedVenue", e.target.value)} />
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

      {issues.length > 0 && (
        <div className="rounded-md border border-amber-600/40 bg-amber-500/5 p-3">
          <p className="text-xs font-medium text-amber-400">Reglas de validación:</p>
          <ul className="mt-1 space-y-1">
            {issues.map((i) => (
              <li key={i.code} className="text-xs text-ink-300">
                {i.blocking ? "🛑" : "⚠️"} {i.message}
              </li>
            ))}
          </ul>
          {issues.some((i) => i.blocking) && (
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-300">
              <input
                type="checkbox"
                checked={values.allowOverride}
                onChange={(e) => set("allowOverride", e.target.checked)}
              />
              Forzar de todos modos (override autorizado)
            </label>
          )}
        </div>
      )}

      <FieldError message={error ?? undefined} />

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Evaluando..." : "Evaluar oportunidad"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
