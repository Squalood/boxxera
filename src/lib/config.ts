/**
 * Central place for values that used to be hardcoded scattered through the
 * app. If the membership price changes, it changes here — never search
 * the codebase for "50".
 */
export const DEFAULT_MEMBERSHIP_MONTHLY_PRICE = 50;
export const DEFAULT_CURRENCY = "MXN";

/**
 * Support request buttons shown in "Mi Apoyo BOXXERA". The value is the
 * Prisma SupportRequestType enum member; label is what the boxer sees;
 * category is the routing bucket used on Task.category.
 */
export const SUPPORT_REQUEST_TYPES: {
  value: string;
  label: string;
  category: "medical" | "legal";
}[] = [
  { value: "ORIENTACION_MEDICA", label: "Necesito orientación médica", category: "medical" },
  { value: "LESION", label: "Tengo una lesión", category: "medical" },
  { value: "ESTUDIO", label: "Necesito un estudio", category: "medical" },
  { value: "MEDICAMENTO", label: "Necesito medicamento", category: "medical" },
  { value: "ORIENTACION_LEGAL", label: "Necesito orientación legal", category: "legal" },
  { value: "DUDA_CONTRATO", label: "Tengo una duda sobre mi contrato", category: "legal" },
  { value: "DUDA_LICENCIA", label: "Tengo una duda sobre mi licencia", category: "legal" },
  { value: "AYUDA_PELEA", label: "Necesito ayuda con una pelea", category: "legal" }
];
