"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Field";
import { WEIGHT_CLASSES } from "@/types";

type Option = { id: string; name: string };

export type FighterFormValues = {
  fullName: string;
  publicName: string;
  dateOfBirth: string;
  nationality: string;
  cityId: string;
  gender: "MALE" | "FEMALE";
  weightClass: string;
  photoUrl: string;
  bio: string;
  commissionId: string;
  gymId: string;
  coachName: string;
};

export function FighterForm({
  fighterId,
  initial,
  cities,
  commissions,
  gyms
}: {
  fighterId?: string;
  initial?: Partial<FighterFormValues>;
  cities: Option[];
  commissions: Option[];
  gyms: Option[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FighterFormValues>({
    fullName: initial?.fullName ?? "",
    publicName: initial?.publicName ?? "",
    dateOfBirth: initial?.dateOfBirth ?? "",
    nationality: initial?.nationality ?? "",
    cityId: initial?.cityId ?? "",
    gender: initial?.gender ?? "MALE",
    weightClass: initial?.weightClass ?? WEIGHT_CLASSES[0],
    photoUrl: initial?.photoUrl ?? "",
    bio: initial?.bio ?? "",
    commissionId: initial?.commissionId ?? "",
    gymId: initial?.gymId ?? "",
    coachName: initial?.coachName ?? ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function set<K extends keyof FighterFormValues>(key: K, value: FighterFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (values.fullName.trim().length < 2) next.fullName = "Nombre completo requerido";
    if (values.publicName.trim().length < 2) next.publicName = "Nombre público requerido";
    if (!values.weightClass) next.weightClass = "Selecciona una categoría";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      ...values,
      cityId: values.cityId || null,
      commissionId: values.commissionId || null,
      gymId: values.gymId || null,
      dateOfBirth: values.dateOfBirth || null
    };

    const res = await fetch(fighterId ? `/api/fighters/${fighterId}` : "/api/fighters", {
      method: fighterId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "No se pudo guardar el fighter.");
      return;
    }

    router.push("/dashboard/fighters");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input id="fullName" value={values.fullName} onChange={(e) => set("fullName", e.target.value)} />
          <FieldError message={errors.fullName} />
        </div>
        <div>
          <Label htmlFor="publicName">Nombre público (ring name)</Label>
          <Input id="publicName" value={values.publicName} onChange={(e) => set("publicName", e.target.value)} />
          <FieldError message={errors.publicName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
          <Input id="dateOfBirth" type="date" value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="gender">Género</Label>
          <Select id="gender" value={values.gender} onChange={(e) => set("gender", e.target.value as "MALE" | "FEMALE")}>
            <option value="MALE">Varonil</option>
            <option value="FEMALE">Femenil</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="weightClass">Categoría de peso</Label>
          <Select id="weightClass" value={values.weightClass} onChange={(e) => set("weightClass", e.target.value)}>
            {WEIGHT_CLASSES.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </Select>
          <FieldError message={errors.weightClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cityId">Ciudad</Label>
          <Select id="cityId" value={values.cityId} onChange={(e) => set("cityId", e.target.value)}>
            <option value="">Sin especificar</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="nationality">Nacionalidad</Label>
          <Input id="nationality" value={values.nationality} onChange={(e) => set("nationality", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="commissionId">Comisión</Label>
          <Select id="commissionId" value={values.commissionId} onChange={(e) => set("commissionId", e.target.value)}>
            <option value="">Sin asignar</option>
            {commissions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="gymId">Gimnasio</Label>
          <Select id="gymId" value={values.gymId} onChange={(e) => set("gymId", e.target.value)}>
            <option value="">Sin asignar</option>
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="coachName">Entrenador</Label>
        <Input id="coachName" value={values.coachName} onChange={(e) => set("coachName", e.target.value)} />
      </div>

      <div>
        <Label htmlFor="photoUrl">URL de foto</Label>
        <Input id="photoUrl" value={values.photoUrl} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} value={values.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>

      {serverError && <p className="text-sm text-red-400">{serverError}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : fighterId ? "Guardar cambios" : "Crear fighter"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
