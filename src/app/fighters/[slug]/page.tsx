import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const fighter = await prisma.fighter.findUnique({ where: { slug: params.slug } });
  if (!fighter) return {};
  return {
    title: `${fighter.publicName} — BOXXERA`,
    description: `${fighter.publicName} · ${fighter.weightClass} · ${fighter.wins}-${fighter.losses}-${fighter.draws}`
  };
}

export default async function FighterProfilePage({ params }: { params: { slug: string } }) {
  const fighter = await prisma.fighter.findUnique({
    where: { slug: params.slug },
    include: {
      city: { include: { region: true } },
      gym: true,
      commission: true,
      fightRecords: { orderBy: { date: "desc" } },
      rankingEntries: { include: { ranking: true } },
      benefitGrants: { include: { benefit: true } },
      licenses: { orderBy: { issuedAt: "desc" } }
    }
  });

  if (!fighter) notFound();

  const upcomingFights = await prisma.fight.findMany({
    where: {
      OR: [{ fighterAId: fighter.id }, { fighterBId: fighter.id }],
      event: { date: { gte: new Date() } }
    },
    include: { event: true, fighterA: true, fighterB: true },
    orderBy: { event: { date: "asc" } }
  });

  return (
    <main className="min-h-screen bg-paper-50">
      <PublicNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <FighterAvatar photoUrl={fighter.photoUrl} name={fighter.publicName} size="lg" />
            <div>
              <h1 className="font-display text-3xl font-semibold text-paper-900">{fighter.publicName}</h1>
              <p className="mt-1 text-paper-600">{fighter.fullName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {fighter.verificationStatus === "VERIFIED" ? (
                  <span className="rounded-full bg-brass-600/10 px-2.5 py-1 text-xs font-medium text-brass-600">
                    BOXXERA Verificado
                  </span>
                ) : (
                  <span className="rounded-full bg-paper-300 px-2.5 py-1 text-xs font-medium text-paper-700">
                    {fighter.verificationStatus === "PENDING" ? "Verificación pendiente" : "Sin verificar"}
                  </span>
                )}
                <span className="rounded-full bg-paper-300 px-2.5 py-1 text-xs font-medium text-paper-700">{fighter.status}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold text-paper-900">
              {fighter.wins}-{fighter.losses}-{fighter.draws}
            </p>
            <p className="text-xs text-paper-600">{fighter.koWins} KOs · {fighter.totalFights} peleas</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoBlock label="Categoría" value={fighter.weightClass} />
          <InfoBlock label="Gimnasio" value={fighter.gym?.name ?? "—"} />
          <InfoBlock label="Ciudad" value={fighter.city?.name ?? "—"} />
          <InfoBlock label="Comisión" value={fighter.commission?.shortName ?? fighter.commission?.name ?? "—"} />
        </div>

        {fighter.bio && (
          <div className="mt-8 rounded-lg border border-paper-300 bg-paper-100 p-5">
            <p className="text-sm text-paper-700">{fighter.bio}</p>
          </div>
        )}

        {upcomingFights.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold text-paper-900">Próximas peleas</h2>
            <div className="mt-3 space-y-2">
              {upcomingFights.map((f) => (
                <div key={f.id} className="rounded-lg border border-paper-300 bg-paper-100 p-4">
                  <p className="text-sm text-paper-900">
                    vs. {f.fighterAId === fighter.id ? f.fighterB.publicName : f.fighterA.publicName}
                  </p>
                  <p className="text-xs text-paper-600">
                    {formatDate(f.event.date)} · {f.event.name} · {f.event.city}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-paper-900">Historial</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-paper-300 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-paper-500">Fecha</th>
                  <th className="border-b border-paper-300 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-paper-500">Rival</th>
                  <th className="border-b border-paper-300 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-paper-500">Resultado</th>
                  <th className="border-b border-paper-300 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-paper-500">Método</th>
                  <th className="border-b border-paper-300 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-paper-500">Round</th>
                  <th className="border-b border-paper-300 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-paper-500">Sede</th>
                </tr>
              </thead>
              <tbody>
                {fighter.fightRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="border-b border-paper-200 px-3 py-2 text-paper-800">{formatDate(r.date)}</td>
                    <td className="border-b border-paper-200 px-3 py-2 text-paper-800">{r.opponentName}</td>
                    <td className="border-b border-paper-200 px-3 py-2 text-paper-800">{r.result}</td>
                    <td className="border-b border-paper-200 px-3 py-2 text-paper-800">{r.method}</td>
                    <td className="border-b border-paper-200 px-3 py-2 text-paper-800">{r.round ?? "—"}</td>
                    <td className="border-b border-paper-200 px-3 py-2 text-paper-800">{r.city ?? r.venue ?? "—"}</td>
                  </tr>
                ))}
                {fighter.fightRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-paper-500">Sin historial registrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {fighter.benefitGrants.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold text-paper-900">Beneficios disponibles</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fighter.benefitGrants.map((g) => (
                <div key={g.id} className="rounded-lg border border-paper-300 bg-paper-100 p-4">
                  <p className="text-sm font-medium text-paper-900">{g.benefit.name}</p>
                  <p className="text-xs text-paper-600">{g.benefit.category} · {g.benefit.providerName ?? "—"}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-paper-300 bg-paper-100 p-4">
      <p className="text-xs uppercase tracking-wide text-paper-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-paper-900">{value}</p>
    </div>
  );
}
