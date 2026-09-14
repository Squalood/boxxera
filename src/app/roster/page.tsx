import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { FighterAvatar } from "@/components/fighters/FighterAvatar";
import { prisma } from "@/lib/prisma";
import { WEIGHT_CLASSES } from "@/types";

type SearchParams = {
  city?: string;
  weightClass?: string;
  gender?: string;
  verified?: string;
};

export default async function RosterPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const fighters = await prisma.fighter.findMany({
    where: {
      status: "ACTIVE",
      ...(searchParams.weightClass ? { weightClass: searchParams.weightClass } : {}),
      ...(searchParams.gender ? { gender: searchParams.gender as any } : {}),
      ...(searchParams.verified === "1" ? { verificationStatus: "VERIFIED" } : {}),
      ...(searchParams.city
        ? { city: { name: { contains: searchParams.city, mode: "insensitive" } } }
        : {})
    },
    include: { city: { include: { region: true } }, gym: true, commission: true },
    orderBy: { publicName: "asc" }
  });

  return (
    <main className="min-h-screen bg-paper-50">
      <PublicNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-paper-900">Padrón público</h1>
        <p className="mt-1 text-sm text-paper-600">
          {fighters.length} boxeadores activos
        </p>

        <form className="mt-6 flex flex-wrap gap-3">
          <input
            name="city"
            defaultValue={searchParams.city}
            placeholder="Ciudad"
            className="rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-900 placeholder:text-paper-500"
          />
          <select
            name="weightClass"
            defaultValue={searchParams.weightClass ?? ""}
            className="rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-900"
          >
            <option value="">Todas las categorías</option>
            {WEIGHT_CLASSES.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <select
            name="gender"
            defaultValue={searchParams.gender ?? ""}
            className="rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-900"
          >
            <option value="">Todos</option>
            <option value="MALE">Varonil</option>
            <option value="FEMALE">Femenil</option>
          </select>
          <label className="flex items-center gap-2 rounded border border-paper-400 bg-paper-50 px-3 py-2 text-sm text-paper-800">
            <input type="checkbox" name="verified" value="1" defaultChecked={searchParams.verified === "1"} />
            Solo verificados
          </label>
          <button className="rounded bg-oxblood-600 px-4 py-2 text-sm font-medium text-paper-50 hover:bg-oxblood-700">
            Filtrar
          </button>
        </form>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fighters.map((f) => (
            <Link
              key={f.id}
              href={`/fighters/${f.slug}`}
              className="rounded-lg border border-paper-300 bg-paper-100 p-4 transition-colors hover:border-paper-500"
            >
              <div className="flex items-start gap-3">
                <FighterAvatar photoUrl={f.photoUrl} name={f.publicName} size="sm" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-medium text-paper-900">{f.publicName}</p>
                      <p className="text-xs text-paper-600">{f.weightClass}</p>
                    </div>
                    {f.verificationStatus === "VERIFIED" && (
                      <span className="rounded-full bg-brass-600/10 px-2 py-0.5 text-[10px] font-medium text-brass-600">
                        Verificado
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-paper-600">
                    <span className="font-display">{f.wins}-{f.losses}-{f.draws}</span>
                    <span>·</span>
                    <span>{f.gym?.name ?? "Sin gimnasio"}</span>
                  </div>
                  <p className="mt-1 text-xs text-paper-500">
                    {f.city?.name ?? "—"} {f.commission ? `· ${f.commission.shortName ?? f.commission.name}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {fighters.length === 0 && (
            <p className="text-sm text-paper-600">No hay boxeadores que coincidan con estos filtros.</p>
          )}
        </div>
      </div>
    </main>
  );
}
