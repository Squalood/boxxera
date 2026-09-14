// A sober fallback (initials on a flat oxblood field, Oswald type) — never a
// cartoon avatar, never a random stock boxing photo. Used across roster,
// fighter profile, and the home showcase so the identity stays consistent
// whether or not a real photoUrl exists yet.

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function FighterAvatar({
  photoUrl,
  name,
  size = "md"
}: {
  photoUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "h-12 w-12 text-sm" : size === "lg" ? "h-28 w-28 text-3xl" : "h-16 w-16 text-lg";

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${dims} shrink-0 rounded-md object-cover border border-paper-300`}
      />
    );
  }

  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-md border border-paper-300 bg-oxblood-600 font-display font-semibold text-paper-50`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
