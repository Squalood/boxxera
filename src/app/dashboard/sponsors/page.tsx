import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Badge";

export default async function SponsorsPage() {
  const user = await getCurrentUser();
  if (!user || !isGlobalAdmin(user)) redirect("/dashboard");

  const sponsors = await prisma.sponsor.findMany({
    include: { sponsorships: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Sponsors</h1>
          <p className="mt-1 text-sm text-ink-400">Empresas que patrocinan boxeadores o eventos.</p>
        </div>
        <Link href="/dashboard/sponsors/new"><Button>Nuevo sponsor</Button></Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sponsors.map((s) => (
          <Link key={s.id} href={`/dashboard/sponsors/${s.id}`}>
            <Card className="hover:border-ink-500">
              <p className="font-medium text-white">{s.companyName}</p>
              <p className="text-xs text-ink-400">{s.industry ?? "—"} · {s.city ?? "—"}</p>
              <p className="mt-1 text-xs text-ink-500">{s.sponsorships.length} patrocinio(s) en pipeline</p>
            </Card>
          </Link>
        ))}
        {sponsors.length === 0 && <p className="text-sm text-ink-500">Sin sponsors registrados todavía.</p>}
      </div>
    </div>
  );
}
