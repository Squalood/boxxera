import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Badge";
import { isGlobalAdmin } from "@/lib/rbac";
import { generateAllRecommendations, type Severity } from "@/lib/engine/orchestrator";
import { SupportPanel } from "@/components/fighters/SupportPanel";
import { formatDate } from "@/lib/utils";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "FIGHTER" && user.fighterId) {
    return <FighterDashboard fighterId={user.fighterId} />;
  }

  if (user.role === "COMMISSION_ADMIN" && user.commissionId) {
    return <CommissionDashboard commissionId={user.commissionId} />;
  }

  if (user.role === "GYM_ADMIN" && user.gymId) {
    return <GymDashboard gymId={user.gymId} />;
  }

  if (user.role === "PROMOTER") {
    redirect("/dashboard/promoter");
  }

  if (user.role === "SPONSOR" && user.sponsorId) {
    return <SponsorDashboard sponsorId={user.sponsorId} />;
  }

  if (!isGlobalAdmin(user)) {
    // No scoped experience defined for this role (e.g. COMMUNITY_MEMBER) —
    // never fall through to the global Command Center.
    redirect("/");
  }

  return <CommandCenter scoped={false} />;
}

// --- BOXXERA COMMAND CENTER --------------------------------------------------
// "¿Qué necesita pasar ahora?" — acciones prioritarias primero, métricas después.

async function CommandCenter({ scoped: _scoped }: { scoped: boolean }) {
  const [recommendations, activeFighters, pendingFighters, commissions, gyms, expiringSoon, pendingVerifications, upcomingFights] =
    await Promise.all([
      generateAllRecommendations(),
      prisma.fighter.count({ where: { status: "ACTIVE" } }),
      prisma.fighter.count({ where: { status: "PENDING" } }),
      prisma.commission.count(),
      prisma.gym.count(),
      prisma.license.count({
        where: { expiresAt: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }, status: "ACTIVE" }
      }),
      prisma.fighter.count({ where: { verificationStatus: "PENDING" } }),
      prisma.fight.count({ where: { event: { date: { gte: new Date() } } } })
    ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">BOXXERA Command Center</h1>
      <p className="mt-1 text-sm text-ink-400">¿Qué necesita pasar ahora? — vista global</p>

      <section className="mt-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-ink-500">Acciones prioritarias</p>
        <div className="space-y-2">
          {recommendations.slice(0, 8).map((r, i) => (
            <Card key={i} className={severityBorder(r.severity)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{r.description}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${severityBadge(r.severity)}`}>
                  {r.severity}
                </span>
              </div>
            </Card>
          ))}
          {recommendations.length === 0 && (
            <p className="text-sm text-ink-500">Sin acciones prioritarias por ahora — todo al día.</p>
          )}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Boxeadores activos" value={activeFighters} />
        <Stat label="Boxeadores pendientes" value={pendingFighters} />
        <Stat label="Comisiones" value={commissions} />
        <Stat label="Gimnasios" value={gyms} />
        <Stat label="Documentos por vencer (30d)" value={expiringSoon} highlight />
        <Stat label="Verificaciones pendientes" value={pendingVerifications} highlight />
        <Stat label="Peleas próximas" value={upcomingFights} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/dashboard/opportunities" className="rounded border border-ink-600 px-3 py-1.5 text-ink-200 hover:border-ink-400">Oportunidades</Link>
        <Link href="/dashboard/events" className="rounded border border-ink-600 px-3 py-1.5 text-ink-200 hover:border-ink-400">Eventos</Link>
        <Link href="/dashboard/sponsors" className="rounded border border-ink-600 px-3 py-1.5 text-ink-200 hover:border-ink-400">Sponsors</Link>
        <Link href="/dashboard/memberships" className="rounded border border-ink-600 px-3 py-1.5 text-ink-200 hover:border-ink-400">Membresías</Link>
        <Link href="/dashboard/fighters" className="rounded border border-ink-600 px-3 py-1.5 text-ink-200 hover:border-ink-400">Boxeadores</Link>
      </div>
    </div>
  );
}

function severityBorder(s: Severity) {
  if (s === "CRITICAL") return "border-red-600/50";
  if (s === "WARNING") return "border-amber-600/40";
  if (s === "OPPORTUNITY") return "border-verified-600/40";
  return "";
}
function severityBadge(s: Severity) {
  if (s === "CRITICAL") return "bg-red-600/15 text-red-400";
  if (s === "WARNING") return "bg-amber-600/15 text-amber-400";
  if (s === "OPPORTUNITY") return "bg-verified-600/15 text-verified-500";
  return "bg-ink-700 text-ink-300";
}

// --- GIMNASIO ----------------------------------------------------------------

async function GymDashboard({ gymId }: { gymId: string }) {
  const [fighters, activeFighters, expiringLicenses, upcomingFights] = await Promise.all([
    prisma.fighter.count({ where: { gymId } }),
    prisma.fighter.count({ where: { gymId, status: "ACTIVE" } }),
    prisma.license.count({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
        fighter: { gymId }
      }
    }),
    prisma.fight.count({
      where: {
        event: { date: { gte: new Date() } },
        OR: [{ fighterA: { gymId } }, { fighterB: { gymId } }]
      }
    })
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Panel de gimnasio</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Boxeadores" value={fighters} />
        <Stat label="Activos" value={activeFighters} />
        <Stat label="Licencias por vencer (30d)" value={expiringLicenses} highlight />
        <Stat label="Peleas próximas" value={upcomingFights} />
      </div>
      <div className="mt-6">
        <Link href="/dashboard/fighters" className="text-sm text-accent-400 hover:underline">Ver mis boxeadores →</Link>
      </div>
    </div>
  );
}

// --- COMISIÓN ---------------------------------------------------------------

async function CommissionDashboard({ commissionId }: { commissionId: string }) {
  const [fighters, licenses, expiring, events] = await Promise.all([
    prisma.fighter.count({ where: { commissionId } }),
    prisma.license.count({ where: { commissionId } }),
    prisma.license.count({
      where: { commissionId, status: "ACTIVE", expiresAt: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } }
    }),
    prisma.event.count({ where: { commissionId, date: { gte: new Date() } } })
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">Panel de comisión</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Boxeadores en jurisdicción" value={fighters} />
        <Stat label="Licencias" value={licenses} />
        <Stat label="Por vencer (30d)" value={expiring} highlight />
        <Stat label="Próximos eventos" value={events} />
      </div>
    </div>
  );
}

// --- SPONSOR ------------------------------------------------------------

async function SponsorDashboard({ sponsorId }: { sponsorId: string }) {
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
    include: { sponsorships: { include: { fighter: true, event: true }, orderBy: { createdAt: "desc" } } }
  });
  if (!sponsor) return <p className="text-ink-400">Sponsor no encontrado.</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-white">{sponsor.companyName}</h1>
      <p className="text-sm text-ink-400">Tu pipeline de patrocinio</p>
      <div className="mt-6 space-y-2">
        {sponsor.sponsorships.map((s) => (
          <Card key={s.id}>
            <p className="text-sm font-medium text-white">{s.program}</p>
            <p className="text-xs text-ink-400">
              {s.fighter?.publicName ?? s.event?.name ?? "—"} · {s.status}
              {s.proposedAmount ? ` · propuesto $${Number(s.proposedAmount).toLocaleString("es-MX")}` : ""}
            </p>
          </Card>
        ))}
        {sponsor.sponsorships.length === 0 && <p className="text-sm text-ink-500">Sin patrocinios registrados todavía.</p>}
      </div>
    </div>
  );
}

// --- BOXEADOR ----------------------------------------------------------------

async function FighterDashboard({ fighterId }: { fighterId: string }) {
  const [fighter, opportunities, nextFight, supportRequests] = await Promise.all([
    prisma.fighter.findUnique({
      where: { id: fighterId },
      include: {
        gym: true,
        commission: true,
        licenses: { orderBy: { issuedAt: "desc" } },
        benefitGrants: { include: { benefit: true } },
        membership: true,
        rankingEntries: { include: { ranking: true } }
      }
    }),
    prisma.fightOpportunity.findMany({
      where: {
        OR: [{ fighterAId: fighterId }, { fighterBId: fighterId }],
        status: { in: ["SUGGESTED", "CONTACTING", "NEGOTIATING", "APPROVED"] }
      },
      include: { fighterA: true, fighterB: true }
    }),
    prisma.fight.findFirst({
      where: {
        OR: [{ fighterAId: fighterId }, { fighterBId: fighterId }],
        event: { date: { gte: new Date() } }
      },
      include: { fighterA: true, fighterB: true, event: true },
      orderBy: { event: { date: "asc" } }
    }),
    prisma.task.findMany({
      where: { fighterId, requestType: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);
  if (!fighter) return <p className="text-ink-400">Perfil no encontrado.</p>;

  const activeLicense = fighter.licenses.find((l) => l.status === "ACTIVE");

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-white">{fighter.publicName}</h1>
      <p className="text-sm text-ink-400">
        {fighter.weightClass} · {fighter.gym?.name ?? "Sin gimnasio"} · {fighter.commission?.shortName ?? fighter.commission?.name ?? "Sin comisión"}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Récord" value={`${fighter.wins}-${fighter.losses}-${fighter.draws}`} />
        <Stat label="Verificación" value={fighter.verificationStatus} />
        <Stat
          label="Ranking"
          value={fighter.rankingEntries[0] ? `#${fighter.rankingEntries[0].position}` : "—"}
        />
        <Stat label="Beneficios" value={fighter.benefitGrants.length} />
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-500">Mi membresía</p>
          {fighter.membership ? (
            <>
              <p className="mt-1 text-sm text-white">
                ${Number(fighter.membership.monthlyPrice).toLocaleString("es-MX")} {fighter.membership.currency}/mes
              </p>
              <p className="text-xs text-ink-400">{fighter.membership.status} · pago: {fighter.membership.paymentStatus}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-400">Todavía no tienes membresía activa.</p>
          )}
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink-500">Mi licencia</p>
          {activeLicense ? (
            <>
              <p className="mt-1 text-sm text-white">{activeLicense.licenseNumber}</p>
              <p className="text-xs text-ink-400">Vence {formatDate(activeLicense.expiresAt)}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-400">Sin licencia activa registrada.</p>
          )}
        </Card>
      </section>

      {nextFight && (
        <section className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-500">Mi próxima pelea</p>
          <Card>
            <p className="text-sm text-white">
              vs. {nextFight.fighterAId === fighterId ? nextFight.fighterB.publicName : nextFight.fighterA.publicName}
            </p>
            <p className="text-xs text-ink-400">{formatDate(nextFight.event.date)} · {nextFight.event.name} · {nextFight.event.city}</p>
          </Card>
        </section>
      )}

      {opportunities.length > 0 && (
        <section className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-500">Mis oportunidades</p>
          <div className="space-y-2">
            {opportunities.map((o) => (
              <Card key={o.id}>
                <p className="text-sm text-white">
                  vs. {o.fighterAId === fighterId ? o.fighterB.publicName : o.fighterA.publicName}
                </p>
                <p className="text-xs text-ink-400">{o.status} · score {o.totalScore ?? "—"}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {fighter.benefitGrants.length > 0 && (
        <section className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-500">Mis beneficios</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fighter.benefitGrants.map((g) => (
              <Card key={g.id}>
                <p className="text-sm text-white">{g.benefit.name}</p>
                <p className="text-xs text-ink-400">{g.benefit.category}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <p className="mb-2 text-xs uppercase tracking-wide text-ink-500">Mi apoyo BOXXERA</p>
        <SupportPanel
          fighterId={fighterId}
          pastRequests={supportRequests.map((r) => ({
            id: r.id,
            title: r.title,
            status: r.status,
            createdAt: r.createdAt.toISOString()
          }))}
        />
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent-500/40" : ""}>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-ink-400">{label}</p>
    </Card>
  );
}
