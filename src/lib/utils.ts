import { clsx, type ClassValue } from "clsx";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Generates a unique fighter slug, appending -2, -3... on collision. */
export async function uniqueFighterSlug(publicName: string): Promise<string> {
  const base = slugify(publicName, { lower: true, strict: true });
  let candidate = base;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.fighter.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${i}`;
    i += 1;
  }
  return candidate;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" });
}
