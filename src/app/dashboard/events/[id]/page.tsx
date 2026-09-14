import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeEventEconomics } from "@/lib/engine/eventEconomics";
import { generateEventRecommendations } from "@/lib/engine/orchestrator";
import { getCurrentUser } from "@/lib/session";
import { canManageEvent, isGlobalAdmin } from "@/lib/rbac";
import { Card } from "@/components/ui/Badge";
import { AddCostForm, AddRevenueForm } from "@/components/events/CostRevenueForms";
import { WhatIfPanel } from "@/components/events/WhatIfPanel";
import { FightApprovalPanel } from "@/components/events/FightApprovalPanel";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  LOSING_MONEY: "Perdiendo dinero",
  BREAK_EVEN: "En punto de equilibrio",
  PROFITABLE: "Rentable"
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "border-red-600/50 text-red-400",
  WARNING: "border-amber-600/40 text-amber-400",
  OPPORTUNITY: "border-verified-600/40 text-verified-500",
  INFO: "border-ink-700 text-ink-300"
};

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      commission: true,
      promoter: { select: { id: true, name: true } },
      fights: { include: { fighterA: true, fighterB: true } },
      costs: { orderBy: { createdAt: "desc" } },
      revenues: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!event) notFound();
  if (!user || (!isGlobalAdmin(user) && !canManageEvent(user, event))) {
    redirect("/dashboard");
  }

  const [economics, recommendations] = await Promise.all([
    computeEventEconomics(event.id),
    generateEventRecommendations(event.id)
  ]);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{event.name}</h1>
          <p className="mt-1 text-sm text-ink-400">
            {formatDate(event.date)} · {event.city} {event.venue ? `· ${event.venue}` : ""} · {event.eventOwner}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            economics.status === "PROFITABLE"
              ? "bg-verified-600/15 text-verified-500"
              : economics.status === "BREAK_EVEN"
              ? "bg-ink-700 text-ink-300"
              : "bg-red-600/15 text-red-400"
          }`}
        >
          {STATUS_LABEL[economics.status]}
        </span>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><p className="text-xs text-ink-500">Ingreso confirmado</p><p className="mt-1 font-semibold text-white">${economics.confirmedRevenue.toLocaleString("es-MX")}</p></Card>
        <Card><p className="text-xs text-ink-500">Costo confirmado</p><p className="mt-1 font-semibold text-white">${economics.confirmedCost.toLocaleString("es-MX")}</p></Card>
        <Card><p className="text-xs text-ink-500">Ingreso proyectado</p><p className="mt-1 font-semibold text-white">${economics.projectedRevenue.toLocaleString("es-MX")}</p></Card>
        <Card><p className="text-xs text-ink-500">Costo proyectado</p><p className="mt-1 font-semibold text-white">${economics.projectedCost.toLocaleString("es-MX")}</p></Card>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className={economics.projectedProfit >= 0 ? "border-verified-600/40" : "border-red-600/40"}>
          <p className="text-xs text-ink-500">Utilidad proyectada</p>
          <p className={`mt-1 font-semibold ${economics.projectedProfit >= 0 ? "text-verified-500" : "text-red-400"}`}>
            ${economics.projectedProfit.toLocaleString("es-MX")}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-ink-500">Margen proyectado</p>
          <p className="mt-1 font-semibold text-white">{economics.margin != null ? `${(economics.margin * 100).toFixed(1)}%` : "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-500">Falta para punto de equilibrio</p>
          <p className="mt-1 font-semibold text-white">${economics.remainingToBreakEven.toLocaleString("es-MX")}</p>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Qué necesita este evento ahora</h2>
        <div className="mt-3 space-y-2">
          {recommendations.map((r, i) => (
            <Card key={i} className={SEVERITY_STYLE[r.severity]?.split(" ")[0]}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{r.description}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-medium ${SEVERITY_STYLE[r.severity]?.split(" ")[1]}`}>
                  {r.severity}
                </span>
              </div>
            </Card>
          ))}
          {recommendations.length === 0 && (
            <p className="text-sm text-ink-500">Sin pendientes detectados — este evento está al día.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Simulación (what-if)</h2>
        <div className="mt-3">
          <WhatIfPanel eventId={event.id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Peleas</h2>
        <div className="mt-3">
          <FightApprovalPanel fights={event.fights} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Costos</h2>
        <div className="mt-3"><AddCostForm eventId={event.id} /></div>
        <div className="mt-4 space-y-2">
          {event.costs.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-ink-800 py-2 text-sm">
              <span className="text-ink-300">{c.category}{c.description ? ` — ${c.description}` : ""}</span>
              <span className="text-white">${Number(c.amount).toLocaleString("es-MX")} · <span className="text-ink-500">{c.confidence}</span></span>
            </div>
          ))}
          {event.costs.length === 0 && <p className="text-sm text-ink-500">Sin costos registrados.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Ingresos</h2>
        <div className="mt-3"><AddRevenueForm eventId={event.id} /></div>
        <div className="mt-4 space-y-2">
          {event.revenues.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-ink-800 py-2 text-sm">
              <span className="text-ink-300">{r.category}{r.description ? ` — ${r.description}` : ""}</span>
              <span className="text-white">${Number(r.amount).toLocaleString("es-MX")} · <span className="text-ink-500">{r.confidence}</span></span>
            </div>
          ))}
          {event.revenues.length === 0 && <p className="text-sm text-ink-500">Sin ingresos registrados.</p>}
        </div>
      </section>
    </div>
  );
}
