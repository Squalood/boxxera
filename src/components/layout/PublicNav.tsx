import Link from "next/link";

export function PublicNav() {
  return (
    <header className="border-b border-paper-300 bg-paper-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-oxblood-600 font-display text-xs font-bold text-paper-50">
            B
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper-900">
            BOXXERA
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-paper-700 md:flex">
          <Link href="/roster" className="hover:text-paper-900">Boxeadores</Link>
          <Link href="/#votacion" className="hover:text-paper-900">Vota la próxima pelea</Link>
          <Link href="/#unete" className="hover:text-paper-900">Únete a BOXXERA</Link>
        </nav>
        <Link
          href="/login"
          className="rounded border border-paper-400 px-4 py-1.5 text-sm text-paper-800 hover:border-paper-600"
        >
          Acceso administrativo
        </Link>
      </div>
    </header>
  );
}
