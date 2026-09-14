import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Card } from "@/components/ui/Badge";
import { InterestButton } from "@/components/sponsors/InterestButton";

export default async function SponsorDiscoverPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SPONSOR" || !user.sponsorId) redirect("/dashboard");

  const [fighters, events, existing] = await Promise.all([
    prisma.fighter.findMany({
      where: { status: "ACTIVE", verificationStatus: "VERIFIED" },
      include: { gym: true },
      orderBy: { wins: "desc" },
      take: 12
    }),
    prisma.event.findMany({
      where: { date: { gte: new Date() }, status: "SCHEDULED" },
      orderBy: { date: "asc" },
      take: 8
    }),
    prisma.sponsorship.findMany({ where: { sponsorId: user.sponsorId } })
  ]);

  const interestedFighterIds = new Set(existing.filter((s) => s.fighterId).map((s) => s.fighterId));
  const interestedEventIds = new Set(existing.filter((s) => s.eventId).map((s) => s.eventId));

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Descubrir</h1>
      <p className="mt-1 text-sm text-ink-400">
        Boxeadores verificados y eventos próximos. Marca "Me interesa" y el equipo de BOXXERA te contacta.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-ink-300">Boxeadores</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fighters.map((f) => (
            <Card key={f.id}>
              <p className="font-medium text-white">{f.publicName}</p>
              <p className="text-xs text-ink-400">{f.weightClass} · {f.gym?.name ?? "Sin gimnasio"}</p>
              <p className="mt-1 text-xs text-ink-500">{f.wins}-{f.losses}-{f.draws}</p>
              <div className="mt-3">
                {interestedFighterIds.has(f.id) ? (
                  <span className="text-xs text-verified-500">Ya marcaste interés</span>
                ) : (
                  <InterestButton fighterId={f.id} />
                )}
              </div>
            </Card>
          ))}
          {fighters.length === 0 && <p className="text-sm text-ink-500">Sin boxeadores verificados todavía.</p>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-ink-300">Eventos próximos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id}>
              <p className="font-medium text-white">{e.name}</p>
              <p className="text-xs text-ink-400">{e.city}</p>
              <div className="mt-3">
                {interestedEventIds.has(e.id) ? (
                  <span className="text-xs text-verified-500">Ya marcaste interés</span>
                ) : (
                  <InterestButton eventId={e.id} />
                )}
              </div>
            </Card>
          ))}
          {events.length === 0 && <p className="text-sm text-ink-500">Sin eventos programados por ahora.</p>}
        </div>
      </section>
    </div>
  );
}
