import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Badge";

export default async function RankingsListPage() {
  const rankings = await prisma.ranking.findMany({
    include: { commission: true, entries: { include: { fighter: true }, orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Rankings</h1>
        <Link href="/dashboard/rankings/new"><Button>Nuevo ranking</Button></Link>
      </div>

      <div className="mt-6 space-y-4">
        {rankings.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">
                  {r.weightClass} · {r.region ?? r.commission?.shortName ?? r.commission?.name ?? "General"}
                </p>
                <p className="text-xs text-ink-400">Periodo {r.period}</p>
              </div>
            </div>
            <ol className="mt-3 space-y-1">
              {r.entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm text-ink-200">
                  <span>#{e.position} {e.fighter.publicName}</span>
                  {e.points != null && <span className="text-ink-500">{e.points} pts</span>}
                </li>
              ))}
              {r.entries.length === 0 && <li className="text-sm text-ink-500">Sin boxeadores en este ranking.</li>}
            </ol>
          </Card>
        ))}
        {rankings.length === 0 && <p className="text-sm text-ink-500">Sin rankings creados todavía.</p>}
      </div>
    </div>
  );
}
