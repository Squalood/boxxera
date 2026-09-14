import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Badge";
import { OpportunityActions } from "@/components/opportunities/OpportunityActions";
import { formatDate } from "@/lib/utils";

const RECOMMENDATION_LABEL: Record<string, string> = {
  viable: "Viable",
  marginal: "Marginal",
  not_recommended: "No recomendada"
};

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const opportunity = await prisma.fightOpportunity.findUnique({
    where: { id: params.id },
    include: {
      fighterA: { include: { gym: true, city: true } },
      fighterB: { include: { gym: true, city: true } },
      commission: true,
      createdBy: true,
      tasks: true
    }
  });
  if (!opportunity) notFound();

  const explanation = opportunity.explanation as any;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {opportunity.fighterA.publicName} <span className="text-ink-500">vs.</span> {opportunity.fighterB.publicName}
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {opportunity.weightClass} · {opportunity.proposedCity ?? "Ciudad sin definir"} ·{" "}
            {opportunity.proposedDate ? formatDate(opportunity.proposedDate) : "Fecha sin definir"}
          </p>
        </div>
        <span className="text-3xl font-semibold text-white">{opportunity.totalScore ?? "—"}</span>
      </div>

      <div className="mt-8">
        <OpportunityActions opportunityId={opportunity.id} status={opportunity.status} />
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-500">Boxeador A</p>
          <p className="mt-1 font-medium text-white">{opportunity.fighterA.publicName}</p>
          <p className="text-xs text-ink-400">
            {opportunity.fighterA.wins}-{opportunity.fighterA.losses}-{opportunity.fighterA.draws} ·{" "}
            {opportunity.fighterA.gym?.name ?? "Sin gimnasio"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-500">Boxeador B</p>
          <p className="mt-1 font-medium text-white">{opportunity.fighterB.publicName}</p>
          <p className="text-xs text-ink-400">
            {opportunity.fighterB.wins}-{opportunity.fighterB.losses}-{opportunity.fighterB.draws} ·{" "}
            {opportunity.fighterB.gym?.name ?? "Sin gimnasio"}
          </p>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Análisis del match</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreCard label="Deportivo" score={opportunity.sportingScore} reasons={explanation?.sporting?.reasons} />
          <ScoreCard label="Comercial" score={opportunity.commercialScore} reasons={explanation?.commercial?.reasons} />
          <ScoreCard label="Logística" score={opportunity.logisticsScore} reasons={explanation?.logistics?.reasons} />
          <ScoreCard label="Económico" score={opportunity.economicScore} reasons={explanation?.economics?.reasons} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Economía proyectada</h2>
        <p className="mt-1 text-xs text-ink-500">
          Confianza del dato: <span className="text-ink-300">{opportunity.dataConfidence}</span> — estos números son
          un punto de partida, no una confirmación.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Card>
            <p className="text-xs text-ink-500">Ingreso proyectado</p>
            <p className="mt-1 text-lg font-semibold text-white">
              ${Number(opportunity.estimatedRevenue ?? 0).toLocaleString("es-MX")} {opportunity.currency}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-ink-500">Costo proyectado</p>
            <p className="mt-1 text-lg font-semibold text-white">
              ${Number(opportunity.estimatedCost ?? 0).toLocaleString("es-MX")} {opportunity.currency}
            </p>
          </Card>
          <Card className={Number(opportunity.estimatedProfit) >= 0 ? "border-verified-600/40" : "border-red-600/40"}>
            <p className="text-xs text-ink-500">Utilidad proyectada</p>
            <p className={`mt-1 text-lg font-semibold ${Number(opportunity.estimatedProfit) >= 0 ? "text-verified-500" : "text-red-400"}`}>
              ${Number(opportunity.estimatedProfit ?? 0).toLocaleString("es-MX")} {opportunity.currency}
            </p>
          </Card>
        </div>
      </section>

      {explanation?.overall && (
        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">Recomendación</h2>
          <Card className="mt-3">
            <p className="text-sm text-white">
              Score general: <span className="font-semibold">{explanation.overall.score}</span> —{" "}
              <span className="font-semibold">{RECOMMENDATION_LABEL[explanation.overall.recommendation] ?? explanation.overall.recommendation}</span>
            </p>
          </Card>
        </section>
      )}

      {opportunity.tasks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">Tareas generadas</h2>
          <div className="mt-3 space-y-2">
            {opportunity.tasks.map((t) => (
              <Card key={t.id}>
                <p className="text-sm text-white">{t.title}</p>
                <p className="text-xs text-ink-400">{t.category} · {t.status}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreCard({ label, score, reasons }: { label: string; score: number | null; reasons?: string[] }) {
  return (
    <Card>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{score ?? "—"}</p>
      {reasons && reasons.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {reasons.slice(0, 2).map((r, i) => (
            <li key={i} className="text-[11px] leading-snug text-ink-400">{r}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
