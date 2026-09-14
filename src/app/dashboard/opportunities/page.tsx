import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

const STATUS_LABEL: Record<string, string> = {
  DISCOVERED: "Descubierta",
  SUGGESTED: "Sugerida",
  CONTACTING: "En contacto",
  NEGOTIATING: "Negociando",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CONVERTED_TO_FIGHT: "Convertida a pelea",
  CANCELLED: "Cancelada"
};

export default async function OpportunitiesBoardPage() {
  const opportunities = await prisma.fightOpportunity.findMany({
    include: { fighterA: true, fighterB: true, commission: true },
    orderBy: [{ totalScore: "desc" }, { createdAt: "desc" }]
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Oportunidades de pelea</h1>
          <p className="mt-1 text-sm text-ink-400">
            {opportunities.length} oportunidades evaluadas por el motor de matchmaking
          </p>
        </div>
        <Link href="/dashboard/opportunities/new"><Button>Nueva oportunidad</Button></Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Categoría</th>
              <th>Deportivo</th>
              <th>Comercial</th>
              <th>Logística</th>
              <th>Económico</th>
              <th>Utilidad proyectada</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id}>
                <td className="font-medium text-white">
                  {o.fighterA.publicName} <span className="text-ink-500">vs.</span> {o.fighterB.publicName}
                </td>
                <td>{o.weightClass}</td>
                <td>{o.sportingScore ?? "—"}</td>
                <td>{o.commercialScore ?? "—"}</td>
                <td>{o.logisticsScore ?? "—"}</td>
                <td>{o.economicScore ?? "—"}</td>
                <td className={o.estimatedProfit != null && Number(o.estimatedProfit) >= 0 ? "text-verified-500" : o.estimatedProfit != null ? "text-red-400" : "text-ink-500"}>
                  {o.estimatedProfit != null
                    ? `$${Number(o.estimatedProfit).toLocaleString("es-MX")} ${o.currency}`
                    : "—"}
                </td>
                <td><span className="badge-pending">{STATUS_LABEL[o.status] ?? o.status}</span></td>
                <td>
                  <Link href={`/dashboard/opportunities/${o.id}`} className="text-sm text-accent-400 hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {opportunities.length === 0 && (
              <tr><td colSpan={9} className="text-center text-ink-500">Sin oportunidades todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
