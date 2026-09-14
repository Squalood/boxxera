import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FighterForm } from "@/components/fighters/FighterForm";
import { VerifyPanel } from "@/components/fighters/VerifyPanel";
import { Card, StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";
import { canVerify } from "@/lib/rbac";

export default async function FighterDetailPage({ params }: { params: { id: string } }) {
  const [fighter, cities, commissions, gyms, user] = await Promise.all([
    prisma.fighter.findUnique({
      where: { id: params.id },
      include: {
        fightRecords: { orderBy: { date: "desc" } },
        licenses: { orderBy: { issuedAt: "desc" } }
      }
    }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.commission.findMany({ orderBy: { name: "asc" } }),
    prisma.gym.findMany({ orderBy: { name: "asc" } }),
    getCurrentUser()
  ]);

  if (!fighter) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{fighter.publicName}</h1>
          <p className="text-sm text-ink-400">{fighter.wins}-{fighter.losses}-{fighter.draws} · {fighter.totalFights} peleas</p>
        </div>
        <StatusBadge status={fighter.status} />
      </div>

      {user && canVerify(user, fighter.commissionId) && (
        <div className="mt-6">
          <VerifyPanel fighterId={fighter.id} currentStatus={fighter.verificationStatus} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium text-white">Datos del boxeador</h2>
        <FighterForm
          fighterId={fighter.id}
          cities={cities}
          commissions={commissions}
          gyms={gyms}
          initial={{
            fullName: fighter.fullName,
            publicName: fighter.publicName,
            dateOfBirth: fighter.dateOfBirth ? fighter.dateOfBirth.toISOString().slice(0, 10) : "",
            nationality: fighter.nationality ?? "",
            cityId: fighter.cityId ?? "",
            gender: fighter.gender,
            weightClass: fighter.weightClass,
            photoUrl: fighter.photoUrl ?? "",
            bio: fighter.bio ?? "",
            commissionId: fighter.commissionId ?? "",
            gymId: fighter.gymId ?? "",
            coachName: fighter.coachName ?? ""
          }}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium text-white">Historial de peleas</h2>
        <div className="space-y-2">
          {fighter.fightRecords.map((r) => (
            <Card key={r.id}>
              <p className="text-sm text-white">{formatDate(r.date)} vs. {r.opponentName} — {r.result} ({r.method})</p>
              <p className="text-xs text-ink-400">{r.eventName ?? "—"} · {r.city ?? r.venue ?? "—"}</p>
            </Card>
          ))}
          {fighter.fightRecords.length === 0 && <p className="text-sm text-ink-500">Sin peleas registradas.</p>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium text-white">Licencias</h2>
        <div className="space-y-2">
          {fighter.licenses.map((l) => (
            <Card key={l.id}>
              <p className="text-sm text-white">{l.type} · {l.licenseNumber}</p>
              <p className="text-xs text-ink-400">
                Emitida {formatDate(l.issuedAt)} · Vence {formatDate(l.expiresAt)} · <StatusBadge status={l.status} />
              </p>
            </Card>
          ))}
          {fighter.licenses.length === 0 && <p className="text-sm text-ink-500">Sin licencias registradas.</p>}
        </div>
      </section>
    </div>
  );
}
