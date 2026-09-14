import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { VoteButton } from "@/components/opportunities/VoteButton";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { MembershipLeadForm } from "@/components/membership/MembershipLeadForm";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { DEFAULT_MEMBERSHIP_MONTHLY_PRICE, DEFAULT_CURRENCY } from "@/lib/config";

// Re-query the database at most once per minute instead of freezing the counts
// into static HTML at build time. Without this, Next.js prerenders this page
// once and the fighter/gym/event totals never change until the next deploy.
export const revalidate = 60;

export default async function HomePage() {
  const [
    fighterCount,
    verifiedCount,
    gymCount,
    commissionCount,
    featuredFighters,
    upcomingEvents,
    confirmedFights,
    votableOpportunities
  ] = await Promise.all([
    prisma.fighter.count({ where: { status: "ACTIVE" } }),
    prisma.fighter.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.gym.count(),
    prisma.commission.count(),
    prisma.fighter.findMany({
      where: { status: "ACTIVE", verificationStatus: "VERIFIED" },
      include: { gym: true },
      orderBy: { wins: "desc" },
      take: 3
    }),
    prisma.event.findMany({
      where: { date: { gte: new Date() }, status: "SCHEDULED" },
      orderBy: { date: "asc" },
      take: 3
    }),
    prisma.fight.findMany({
      where: { status: "CONFIRMED", event: { date: { gte: new Date() } } },
      include: { fighterA: true, fighterB: true, event: true },
      orderBy: { event: { date: "asc" } },
      take: 3
    }),
    prisma.fightOpportunity.findMany({
      where: { status: { in: ["SUGGESTED", "CONTACTING", "NEGOTIATING"] } },
      include: { fighterA: true, fighterB: true, votes: true },
      orderBy: { totalScore: "desc" },
      take: 3
    })
  ]);

  return (
    <main className="min-h-screen bg-paper-50">
      <PublicNav />

      {/* HERO */}
      <section className="border-b border-paper-300 bg-paper-100">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <span className="mb-5 inline-block rounded-full border border-paper-400 bg-paper-50 px-3 py-1 text-[11px] text-paper-700">
            Aliado de la H. Comisión de Boxeo Profesional de Ciudad Juárez
          </span>
          <p className="max-w-2xl font-display text-3xl font-semibold leading-tight text-paper-900 sm:text-4xl">
            El boxeo profesional de la frontera, en un solo lugar.
          </p>
          <p className="mt-3 max-w-lg text-base text-paper-700">
            Boxeadores. Peleas. Eventos. Oportunidades.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/roster" className="rounded bg-oxblood-600 px-5 py-2.5 text-sm font-medium text-paper-50 hover:bg-oxblood-700">
              Ver boxeadores
            </Link>
            <Link href="#unete" className="rounded border border-paper-400 px-5 py-2.5 text-sm font-medium text-paper-800 hover:border-paper-600">
              Soy boxeador
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-paper-300 pt-8 sm:grid-cols-4">
            <Stat label="Boxeadores activos" value={fighterCount} />
            <Stat label="Verificados" value={verifiedCount} accent />
            <Stat label="Gimnasios" value={gymCount} />
            <Stat label="Comisión aliada" value={commissionCount} />
          </div>
        </div>
      </section>

      {/* PRÓXIMAS PELEAS (confirmadas) */}
      {confirmedFights.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-xl font-semibold text-paper-900">Próximas peleas</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {confirmedFights.map((f) => (
              <div key={f.id} className="rounded-lg border border-paper-300 bg-paper-100 p-4">
                <p className="font-display text-sm font-medium text-paper-900">
                  {f.fighterA.publicName} <span className="text-paper-500">vs.</span> {f.fighterB.publicName}
                </p>
                <p className="mt-1 text-xs text-paper-600">{formatDate(f.event.date)} · {f.event.city}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ¿QUIÉN PELEA LA PRÓXIMA VEZ? — votación pública */}
      <section id="votacion" className="border-t border-paper-300 bg-paper-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-xl font-semibold text-paper-900">¿Quién pelea la próxima vez?</h2>
          <p className="mt-2 max-w-xl text-sm text-paper-700">
            Estas son oportunidades de pelea ya evaluadas por nuestro sistema de
            matchmaking. Tu voto no decide reglamento ni aprobaciones — es la
            señal de qué enfrentamiento genera más interés real.
          </p>
          <div className="mt-6 space-y-3">
            {votableOpportunities.map((o) => (
              <div key={o.id} className="flex flex-col gap-3 rounded-lg border border-paper-300 bg-paper-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-sm font-medium text-paper-900">
                    {o.fighterA.publicName} <span className="text-paper-500">vs.</span> {o.fighterB.publicName}
                  </p>
                  <p className="text-xs text-paper-600">{o.weightClass} {o.proposedCity ? `· ${o.proposedCity}` : ""}</p>
                </div>
                <VoteButton opportunityId={o.id} initialCount={o.votes.length} />
              </div>
            ))}
            {votableOpportunities.length === 0 && (
              <p className="text-sm text-paper-600">Sin oportunidades abiertas a votación por ahora.</p>
            )}
          </div>
        </div>
      </section>

      {/* BOXEADORES DESTACADOS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-xl font-semibold text-paper-900">
          Quiénes son. Dónde entrenan. Qué récord tienen.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {featuredFighters.map((f) => (
            <Link key={f.id} href={`/fighters/${f.slug}`} className="rounded-lg border border-paper-300 bg-paper-100 p-4 hover:border-paper-500">
              <div className="flex items-start gap-3">
                <FighterAvatar photoUrl={f.photoUrl} name={f.publicName} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-medium text-paper-900">{f.publicName}</p>
                    <span className="rounded-full bg-brass-600/10 px-2 py-0.5 text-[10px] font-medium text-brass-600">
                      Verificado
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-paper-600">{f.weightClass} · {f.gym?.name ?? "Sin gimnasio"}</p>
                  <p className="mt-2 font-display text-sm text-paper-900">{f.wins}–{f.losses}–{f.draws}</p>
                </div>
              </div>
            </Link>
          ))}
          {featuredFighters.length === 0 && (
            <p className="text-sm text-paper-600">Todavía no hay boxeadores verificados en el padrón.</p>
          )}
        </div>
      </section>

      {/* PRÓXIMOS EVENTOS */}
      <section className="border-t border-paper-300 bg-paper-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-xl font-semibold text-paper-900">Próximos eventos</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="rounded-lg border border-paper-300 bg-paper-50 p-4">
                <p className="font-display font-medium text-paper-900">{e.name}</p>
                <p className="mt-1 text-xs text-paper-600">{formatDate(e.date)} · {e.city}</p>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-paper-600">Sin eventos programados por ahora.</p>
            )}
          </div>
        </div>
      </section>

      {/* PARA EL BOXEADOR / PROMOTORES / SPONSORS / RESPALDO */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-display font-medium text-paper-900">Para el boxeador</h3>
            <p className="mt-2 text-sm text-paper-700">
              Perfil profesional, récord protegido, licencia, ranking cuando
              corresponda, oportunidades de pelea, y beneficios reales —
              farmacia a precio de proveedor, consulta médica preferencial,
              orientación legal. Ser miembro de BOXXERA significa no estar
              solo dentro del boxeo profesional.
            </p>
          </div>
          <div>
            <h3 className="font-display font-medium text-paper-900">Para promotores</h3>
            <p className="mt-2 text-sm text-paper-700">
              Boxeadores verificados, récord, licencias, matchups posibles y
              demanda real del público — construye mejores carteleras sin
              llamar gimnasio por gimnasio.
            </p>
          </div>
          <div>
            <h3 className="font-display font-medium text-paper-900">Para sponsors</h3>
            <p className="mt-2 text-sm text-paper-700">
              Descubre boxeadores y eventos con demanda comprobada, y expresa
              interés directo — sin intermediarios ni promesas vacías.
            </p>
          </div>
          <div>
            <h3 className="font-display font-medium text-paper-900">Respaldo institucional</h3>
            <p className="mt-2 text-sm text-paper-700">
              Aliado de la H. Comisión de Boxeo Profesional de Ciudad Juárez
              — la Comisión regula y valida; BOXXERA organiza, conecta y
              opera la infraestructura.
            </p>
          </div>
        </div>
      </section>

      {/* ÚNETE A BOXXERA — membresía del boxeador */}
      <section id="unete" className="border-t border-paper-300 bg-paper-100">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-paper-900">Únete a BOXXERA</h2>
          <p className="mt-1 font-display text-lg text-brass-600">
            ${DEFAULT_MEMBERSHIP_MONTHLY_PRICE} {DEFAULT_CURRENCY} / mes
          </p>
          <p className="mt-3 max-w-xl text-sm text-paper-700">
            Tu lugar dentro del boxeo profesional. Incluye perfil profesional,
            padrón, oportunidades, beneficios médicos, orientación legal,
            visibilidad ante promotores y patrocinadores, y acompañamiento de
            BOXXERA cuando lo necesites.
          </p>
          <div className="mt-6">
            <MembershipLeadForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={`font-display text-2xl font-semibold ${accent ? "text-brass-600" : "text-paper-900"}`}>{value}</p>
      <p className="mt-1 text-xs text-paper-600">{label}</p>
    </div>
  );
}
