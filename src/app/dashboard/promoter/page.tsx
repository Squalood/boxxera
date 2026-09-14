import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Card } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default async function PromoterDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PROMOTER" && user.role !== "BOXERA_ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [myOpportunities, myEvents] = await Promise.all([
    prisma.fightOpportunity.findMany({
      where: user.role === "PROMOTER" ? { createdById: user.id } : {},
      include: { fighterA: true, fighterB: true },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.event.findMany({
      where: user.role === "PROMOTER" ? { promoterId: user.id } : {},
      orderBy: { date: "desc" },
      take: 10
    })
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Panel de promotor</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/opportunities/new"><Button variant="secondary">Nueva oportunidad</Button></Link>
          <Link href="/dashboard/events/new"><Button>Nuevo evento</Button></Link>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Tus oportunidades</h2>
        <div className="mt-3 space-y-2">
          {myOpportunities.map((o) => (
            <Link key={o.id} href={`/dashboard/opportunities/${o.id}`}>
              <Card className="hover:border-ink-500">
                <p className="text-sm text-white">{o.fighterA.publicName} vs. {o.fighterB.publicName}</p>
                <p className="text-xs text-ink-400">{o.status} · score {o.totalScore ?? "—"}</p>
              </Card>
            </Link>
          ))}
          {myOpportunities.length === 0 && <p className="text-sm text-ink-500">Sin oportunidades creadas todavía.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-white">Tus eventos</h2>
        <div className="mt-3 space-y-2">
          {myEvents.map((e) => (
            <Link key={e.id} href={`/dashboard/events/${e.id}`}>
              <Card className="hover:border-ink-500">
                <p className="text-sm text-white">{e.name}</p>
                <p className="text-xs text-ink-400">{formatDate(e.date)} · {e.city} · {e.status}</p>
              </Card>
            </Link>
          ))}
          {myEvents.length === 0 && <p className="text-sm text-ink-500">Sin eventos creados todavía.</p>}
        </div>
      </section>
    </div>
  );
}
