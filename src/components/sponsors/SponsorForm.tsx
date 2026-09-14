"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";

export function SponsorForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    industry: "",
    city: "",
    website: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (values.companyName.trim().length < 2) {
      setError("Nombre de la empresa requerido");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo guardar.");
      return;
    }
    const sponsor = await res.json();
    router.push(`/dashboard/sponsors/${sponsor.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="companyName">Empresa</Label>
        <Input id="companyName" value={values.companyName} onChange={(e) => set("companyName", e.target.value)} />
        <FieldError message={error ?? undefined} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactName">Contacto</Label>
          <Input id="contactName" value={values.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contactEmail">Correo</Label>
          <Input id="contactEmail" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="industry">Industria</Label>
          <Input id="industry" value={values.industry} onChange={(e) => set("industry", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="website">Sitio web</Label>
        <Input id="website" value={values.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Crear sponsor"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
