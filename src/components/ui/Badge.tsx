import { cn } from "@/lib/utils";

export function VerifiedBadge({ status }: { status: "VERIFIED" | "PENDING" | "UNVERIFIED" | "REJECTED" }) {
  if (status === "VERIFIED") {
    return (
      <span className="badge-verified">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        BOXXERA Verificado
      </span>
    );
  }
  if (status === "PENDING") {
    return <span className="badge-pending">Verificación pendiente</span>;
  }
  if (status === "REJECTED") {
    return <span className="inline-flex rounded-full bg-red-600/15 px-2.5 py-1 text-xs font-medium text-red-400">Rechazado</span>;
  }
  return <span className="badge-pending">Sin verificar</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    ACTIVE: "bg-verified-600/15 text-verified-500",
    PENDING: "bg-amber-600/15 text-amber-400",
    SUSPENDED: "bg-red-600/15 text-red-400",
    INACTIVE: "bg-ink-700 text-ink-300",
    RETIRED: "bg-ink-700 text-ink-400",
    EXPIRED: "bg-red-600/15 text-red-400",
    REVOKED: "bg-red-600/15 text-red-400"
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", colorMap[status] ?? "bg-ink-700 text-ink-300")}>
      {status}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card p-5", className)}>{children}</div>;
}
