import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isGlobalAdmin } from "@/lib/rbac";
import { Card } from "@/components/ui/Badge";
import { SponsorshipForm } from "@/components/sponsors/SponsorshipForm";
import { SponsorshipStatusControl } from "@/components/sponsors/SponsorshipStatusControl";

export default async function SponsorDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || !isGlobalAdmin(user)) redirect("/dashboard");

  const [sponsor, fighters, events] = await Promise.all([
    prisma.sponsor.findUnique({
      where: { id: params.id },
      include: {
        sponsorships: { include: { fighter: true, event: true }, orderBy: { createdAt: "desc" } }
      }
    }),
    prisma.fighter.findMany({ where: { status: "ACTIVE" }, orderBy: { publicName: "asc" } }),
    prisma.event.findMany({ orderBy: { date: "desc" } })
  ]);
  if (!sponsor) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-white">{sponsor.companyName}</h1>
      <p className="mt-1 text-sm text-ink-400">
        {sponsor.contactName ?? "Sin contacto"} · {sponsor.contactEmail ?? "—"}
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-ink-300">Pipeline de patrocinio</h2>
        <div className="space-y-2">
          {sponsor.sponsorships.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{s.program}</p>
                  <p className="text-xs text-ink-400">
                    {s.fighter?.publicName ?? s.event?.name ?? "Sin boxeador/evento"}
                    {s.proposedAmount ? ` · propuesto $${Number(s.proposedAmount).toLocaleString("es-MX")}` : ""}
                    {s.confirmedAmount ? ` · confirmado $${Number(s.confirmedAmount).toLocaleString("es-MX")}` : ""}
                  </p>
                  {s.benefits && <p className="mt-1 text-xs text-ink-500">{s.benefits}</p>}
                </div>
                <SponsorshipStatusControl sponsorshipId={s.id} status={s.status} />
              </div>
            </Card>
          ))}
          {sponsor.sponsorships.length === 0 && <p className="text-sm text-ink-500">Sin patrocinios en pipeline.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-ink-300">Agregar al pipeline</h2>
        <SponsorshipForm sponsorId={sponsor.id} fighters={fighters} events={events} />
      </section>
    </div>
  );
}
