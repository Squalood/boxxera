"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";

const COST_CATEGORIES = [
  "FIGHTER_PURSE", "VENUE", "COMMISSION", "MEDICAL", "PRODUCTION", "SECURITY",
  "TRAVEL", "HOTEL", "MARKETING", "INSURANCE", "STAFF", "EQUIPMENT", "OTHER"
];
const REVENUE_CATEGORIES = [
  "TICKETS", "SPONSORSHIP", "STREAMING", "PPV", "HOSPITALITY", "ACTIVATION",
  "MERCHANDISING", "MEDIA", "OTHER"
];
const CONFIDENCE = ["CONFIRMED", "ESTIMATED", "ASSUMED", "PROPOSED"];
const LINE_STATUS_COST = ["PLANNED", "PENDING", "PAID", "CANCELLED"];
const LINE_STATUS_REVENUE = ["PLANNED", "PENDING", "RECEIVED", "CANCELLED"];

function LineItemForm({
  eventId,
  kind
}: {
  eventId: string;
  kind: "cost" | "revenue";
}) {
  const router = useRouter();
  const categories = kind === "cost" ? COST_CATEGORIES : REVENUE_CATEGORIES;
  const statuses = kind === "cost" ? LINE_STATUS_COST : LINE_STATUS_REVENUE;
  const [values, setValues] = useState({
    category: categories[0],
    description: "",
    amount: "",
    confidence: "ESTIMATED",
    status: "PLANNED"
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = Number(values.amount);
    if (!amount || amount <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/events/${eventId}/${kind === "cost" ? "costs" : "revenue"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, amount })
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar.");
      return;
    }
    setValues({ category: categories[0], description: "", amount: "", confidence: "ESTIMATED", status: "PLANNED" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:items-end">
      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor={`${kind}-category`}>Categoría</Label>
        <Select id={`${kind}-category`} value={values.category} onChange={(e) => set("category", e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor={`${kind}-description`}>Descripción</Label>
        <Input id={`${kind}-description`} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div>
        <Label htmlFor={`${kind}-amount`}>Monto (MXN)</Label>
        <Input id={`${kind}-amount`} type="number" value={values.amount} onChange={(e) => set("amount", e.target.value)} />
      </div>
      <div>
        <Label htmlFor={`${kind}-confidence`}>Confianza</Label>
        <Select id={`${kind}-confidence`} value={values.confidence} onChange={(e) => set("confidence", e.target.value)}>
          {CONFIDENCE.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Select value={values.status} onChange={(e) => set("status", e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Button type="submit" disabled={submitting} className="whitespace-nowrap">
          {submitting ? "..." : "Agregar"}
        </Button>
      </div>
      {error && <p className="col-span-full text-xs text-red-400">{error}</p>}
    </form>
  );
}

export function AddCostForm({ eventId }: { eventId: string }) {
  return <LineItemForm eventId={eventId} kind="cost" />;
}

export function AddRevenueForm({ eventId }: { eventId: string }) {
  return <LineItemForm eventId={eventId} kind="revenue" />;
}
