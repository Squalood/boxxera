import Link from "next/link";
import type { SessionUser } from "@/lib/rbac";

const ITEMS: { href: string; label: string; roles?: string[] }[] = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/fighters", label: "Boxeadores" },
  { href: "/dashboard/gyms", label: "Gimnasios" },
  { href: "/dashboard/commissions", label: "Comisiones", roles: ["SUPER_ADMIN", "BOXERA_ADMIN"] },
  { href: "/dashboard/licenses", label: "Licencias" },
  { href: "/dashboard/rankings", label: "Ranking" },
  { href: "/dashboard/opportunities", label: "Oportunidades" },
  { href: "/dashboard/events", label: "Eventos" },
  { href: "/dashboard/sponsors", label: "Sponsors", roles: ["SUPER_ADMIN", "BOXERA_ADMIN"] },
  { href: "/dashboard/sponsor/discover", label: "Descubrir", roles: ["SPONSOR"] },
  { href: "/dashboard/memberships", label: "Membresías", roles: ["SUPER_ADMIN", "BOXERA_ADMIN", "COMMISSION_ADMIN"] },
  { href: "/dashboard/promoter", label: "Panel de promotor", roles: ["PROMOTER", "SUPER_ADMIN", "BOXERA_ADMIN"] },
  { href: "/dashboard/audit", label: "Auditoría", roles: ["SUPER_ADMIN", "BOXERA_ADMIN"] }
];

export function Sidebar({ user }: { user: SessionUser }) {
  const items = ITEMS.filter((i) => !i.roles || i.roles.includes(user.role));

  return (
    <aside className="w-56 shrink-0 border-r border-ink-800 bg-ink-950 px-3 py-6">
      <Link href="/" className="mb-8 block px-2 text-lg font-semibold text-white">
        BOXX<span className="text-accent-500">ERA</span>
      </Link>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-2 py-2 text-sm text-ink-300 hover:bg-ink-800 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-10 border-t border-ink-800 pt-4 px-2">
        <p className="text-xs text-ink-500">Rol</p>
        <p className="text-sm text-ink-200">{user.role.replace("_", " ")}</p>
      </div>
    </aside>
  );
}
