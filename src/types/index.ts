export type ApiError = {
  error: string;
  details?: unknown;
};

export const WEIGHT_CLASSES = [
  "Minimosca",
  "Mosca",
  "Supermosca",
  "Gallo",
  "Supergallo",
  "Pluma",
  "Superpluma",
  "Ligero",
  "Superligero",
  "Wélter",
  "Superwélter",
  "Mediano",
  "Supermediano",
  "Semipesado",
  "Crucero",
  "Pesado"
] as const;

export const NAV_ITEMS = [
  { href: "/roster", label: "Roster" },
  { href: "/roster?tab=commissions", label: "Commissions" },
  { href: "/roster?tab=gyms", label: "Gyms" },
  { href: "/roster?tab=rankings", label: "Rankings" },
  { href: "/roster?tab=events", label: "Events" },
  { href: "/roster?tab=benefits", label: "Benefits" },
  { href: "/roster?tab=community", label: "Community" },
  { href: "/roster?tab=sponsors", label: "Sponsors" }
] as const;
