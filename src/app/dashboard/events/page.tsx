import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Badge";
import { computeEventEconomics } from "@/lib/engine/eventEconomics";
import { formatDate } from "@/lib/utils";

export default async function EventCommandCenterPage() {
  const events = await prisma.event.findMany({
    include: { commission: true, fights: true },
    orderBy: { date: "desc" }
  });

  const now = new Date();
  const upcoming = events.filter((e) => e.date >= now && e.status !== "CANCELLED");
  const active = events.filter((e) => e.status === "SCHEDULED" && e.date < now);
  const completed = events.filter((e) => e.status === "COMPLETED");

  const economics = await Promise.all(events.map((e) => computeEventEconomics(e.id)));
  const totals = economics.reduce(
    (acc, e) => ({
      confirmedRevenue: acc.confirmedRevenue + e.confirmedRevenue,
      projectedRevenue: acc.projectedRevenue + e.projectedRevenue,
      projectedCost: acc.projectedCost + e.projectedCost,
      projectedProfit: acc.projectedProfit + e.projectedProfit
    }),
    { confirmedRevenue: 0, projectedRevenue: 0, projectedCost: 0, projectedProfit: 0 }
  );

  const fightsByStatus = events
    .flatMap((e) => e.fights)
    .reduce<Record<string, number>>((acc, f) => {
      acc[f.status] = (acc[f.status] ?? 0) + 1;
      return acc;
    }, {});

  const risks: string[] = [];
  events.forEach((e, i) => {
    const econ = economics[i];
    if (econ.remainingToBreakEven > 0 && e.date < new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)) {
      risks.push(`${e.name}: faltan $${econ.remainingToBreakEven.toLocaleString("es-MX")} para punto de equilibrio y el evento es en menos de 2 semanas`);
    }
    const pendingCommission = e.fights.some((f) => f.commissionStatus === "PENDING");
    const pendingMedical = e.fights.some((f) => f.medicalStatus === "PENDING");
    const pendingContract = e.fights.some((f) => f.contractStatus === "PENDING");
    if (pendingCommission) risks.push(`${e.name}: hay peleas sin aprobación de comisión`);
    if (pendingMedical) risks.push(`${e.name}: hay peleas sin revisión médica`);
    if (pendingContract) risks.push(`${e.name}: hay peleas sin contrato firmado`);
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Event Command Center</h1>
        <Link href="/dashboard/events/new"><Button>Nuevo evento</Button></Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><p className="text-xs text-ink-500">Ingreso confirmado</p><p className="mt-1 text-lg font-semibold text-white">${totals.confirmedRevenue.toLocaleString("es-MX")}</p></Card>
        <Card><p className="text-xs text-ink-500">Ingreso proyectado</p><p className="mt-1 text-lg font-semibold text-white">${totals.projectedRevenue.toLocaleString("es-MX")}</p></Card>
        <Card><p className="text-xs text-ink-500">Costo proyectado</p><p className="mt-1 text-lg font-semibold text-white">${totals.projectedCost.toLocaleString("es-MX")}</p></Card>
        <Card className={totals.projectedProfit >= 0 ? "border-verified-600/40" : "border-red-600/40"}>
          <p className="text-xs text-ink-500">Utilidad proyectada</p>
          <p className={`mt-1 text-lg font-semibold ${totals.projectedProfit >= 0 ? "text-verified-500" : "text-red-400"}`}>
            ${totals.projectedProfit.toLocaleString("es-MX")}
          </p>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <h2 className="mb-2 text-sm font-medium text-ink-300">Eventos ({upcoming.length} próximos, {active.length} activos, {completed.length} completados)</h2>
          <div className="space-y-2">
            {events.map((e, i) => (
              <Link key={e.id} href={`/dashboard/events/${e.id}`}>
                <Card className="hover:border-ink-500">
                  <p className="font-medium text-white">{e.name}</p>
                  <p className="text-xs text-ink-400">{formatDate(e.date)} · {e.city} · {e.status}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Utilidad proyectada: ${economics[i].projectedProfit.toLocaleString("es-MX")}
                  </p>
                </Card>
              </Link>
            ))}
            {events.length === 0 && <p className="text-sm text-ink-500">Sin eventos todavía.</p>}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-ink-300">Peleas por estado</h2>
          <div className="space-y-2">
            {Object.entries(fightsByStatus).map(([status, count]) => (
              <Card key={status}>
                <p className="text-sm text-white">{status}</p>
                <p className="text-xs text-ink-400">{count} pelea(s)</p>
              </Card>
            ))}
            {Object.keys(fightsByStatus).length === 0 && <p className="text-sm text-ink-500">Sin peleas todavía.</p>}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-ink-300">Riesgos</h2>
          <div className="space-y-2">
            {risks.map((r, i) => (
              <Card key={i} className="border-amber-600/40">
                <p className="text-xs text-amber-400">{r}</p>
              </Card>
            ))}
            {risks.length === 0 && <p className="text-sm text-ink-500">Sin riesgos detectados.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
