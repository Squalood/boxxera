import { z } from "zod";

export const fighterCreateSchema = z.object({
  fullName: z.string().min(2, "Nombre completo requerido"),
  publicName: z.string().min(2, "Nombre público requerido"),
  dateOfBirth: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE"]),
  weightClass: z.string().min(1, "Categoría de peso requerida"),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  bio: z.string().optional().nullable(),
  commissionId: z.string().optional().nullable(),
  gymId: z.string().optional().nullable(),
  coachName: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable()
});

export const fighterUpdateSchema = fighterCreateSchema.partial().extend({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE", "RETIRED"]).optional()
});

export const commissionCreateSchema = z.object({
  name: z.string().min(2),
  shortName: z.string().optional().nullable(),
  cityId: z.string().min(1, "Ciudad requerida"),
  jurisdiction: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  contactPhone: z.string().optional().nullable()
});

export const gymCreateSchema = z.object({
  name: z.string().min(2),
  cityId: z.string().min(1, "Ciudad requerida"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  headCoach: z.string().optional().nullable(),
  responsibleName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  commissionId: z.string().optional().nullable()
});

export const licenseCreateSchema = z.object({
  licenseNumber: z.string().min(1),
  fighterId: z.string().min(1),
  commissionId: z.string().min(1),
  type: z.string().min(1),
  issuedAt: z.string(),
  expiresAt: z.string().optional().nullable(),
  documentUrl: z.string().url().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable()
});

export const fightRecordCreateSchema = z.object({
  fighterId: z.string().min(1),
  date: z.string(),
  opponentName: z.string().min(1),
  result: z.enum(["WIN", "LOSS", "DRAW", "NO_CONTEST"]),
  method: z.enum(["KO", "TKO", "DECISION", "TECHNICAL_DECISION", "DQ", "OTHER"]),
  round: z.number().int().optional().nullable(),
  venue: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  eventName: z.string().optional().nullable(),
  commissionId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional().nullable()
});

// --- Fight & Event Engine ----------------------------------------------------

export const opportunityCreateSchema = z.object({
  fighterAId: z.string().min(1),
  fighterBId: z.string().min(1),
  weightClass: z.string().min(1),
  proposedDate: z.string().optional().nullable(),
  proposedCity: z.string().optional().nullable(),
  proposedVenue: z.string().optional().nullable(),
  commissionId: z.string().optional().nullable(),
  source: z
    .enum(["PROMOTER", "COMMISSION", "GYM", "FIGHTER", "BOXXERA", "ALGORITHM"])
    .default("BOXXERA"),
  allowOverride: z.boolean().optional().default(false)
});

export const opportunityStatusSchema = z.object({
  status: z.enum([
    "DISCOVERED",
    "SUGGESTED",
    "CONTACTING",
    "NEGOTIATING",
    "APPROVED",
    "REJECTED",
    "CANCELLED"
  ])
});

export const eventCostCreateSchema = z.object({
  category: z.enum([
    "FIGHTER_PURSE",
    "VENUE",
    "COMMISSION",
    "MEDICAL",
    "PRODUCTION",
    "SECURITY",
    "TRAVEL",
    "HOTEL",
    "MARKETING",
    "INSURANCE",
    "STAFF",
    "EQUIPMENT",
    "OTHER"
  ]),
  description: z.string().optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().default("MXN"),
  vendor: z.string().optional().nullable(),
  confidence: z.enum(["CONFIRMED", "ESTIMATED", "ASSUMED", "PROPOSED"]).default("ESTIMATED"),
  status: z.enum(["PLANNED", "PENDING", "PAID", "RECEIVED", "CANCELLED"]).default("PLANNED")
});

export const eventRevenueCreateSchema = z.object({
  category: z.enum([
    "TICKETS",
    "SPONSORSHIP",
    "STREAMING",
    "PPV",
    "HOSPITALITY",
    "ACTIVATION",
    "MERCHANDISING",
    "MEDIA",
    "OTHER"
  ]),
  description: z.string().optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().default("MXN"),
  source: z.string().optional().nullable(),
  confidence: z.enum(["CONFIRMED", "ESTIMATED", "ASSUMED", "PROPOSED"]).default("ESTIMATED"),
  status: z.enum(["PLANNED", "PENDING", "PAID", "RECEIVED", "CANCELLED"]).default("PLANNED")
});

export const eventUpdateSchema = z.object({
  capacity: z.number().int().positive().optional().nullable(),
  expectedAttendance: z.number().int().positive().optional().nullable(),
  eventOwner: z.enum(["EXTERNAL_PROMOTER", "BOXXERA", "CO_PRODUCED"]).optional(),
  promoterId: z.string().optional().nullable()
});

export const fightStatusUpdateSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "NEGOTIATING",
      "PENDING_COMMISSION",
      "PENDING_MEDICAL",
      "PENDING_CONTRACT",
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED"
    ])
    .optional(),
  purseA: z.number().nonnegative().optional().nullable(),
  purseB: z.number().nonnegative().optional().nullable(),
  commissionStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  medicalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  contractStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional()
});

// --- Boxer membership ---------------------------------------------------

export const membershipCreateSchema = z.object({
  fighterId: z.string().min(1),
  monthlyPrice: z.number().positive().optional(),
  currency: z.string().default("MXN"),
  status: z.enum(["ACTIVE", "PAST_DUE", "CANCELLED", "PENDING"]).default("PENDING")
});

export const membershipUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "PAST_DUE", "CANCELLED", "PENDING"]).optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "FAILED"]).optional(),
  monthlyPrice: z.number().positive().optional(),
  startDate: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  lastPaymentDate: z.string().optional().nullable()
});

// --- Sponsors -------------------------------------------------------------

export const sponsorCreateSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  industry: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal(""))
});

export const sponsorshipCreateSchema = z.object({
  sponsorId: z.string().min(1),
  program: z.string().min(1),
  fighterId: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
  proposedAmount: z.number().positive().optional().nullable(),
  currency: z.string().default("MXN"),
  benefits: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const sponsorshipUpdateSchema = z.object({
  status: z.enum(["DISCOVERED", "INTERESTED", "CONTACTED", "NEGOTIATING", "CONFIRMED", "LOST"]).optional(),
  confirmedAmount: z.number().positive().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// --- Boxer support ("Mi Apoyo BOXXERA") ------------------------------------

export const supportRequestSchema = z.object({
  fighterId: z.string().min(1),
  requestType: z.enum([
    "ORIENTACION_MEDICA",
    "LESION",
    "ESTUDIO",
    "MEDICAMENTO",
    "ORIENTACION_LEGAL",
    "DUDA_CONTRATO",
    "DUDA_LICENCIA",
    "AYUDA_PELEA"
  ]),
  notes: z.string().optional().nullable()
});

export const rankingEntrySchema = z.object({
  rankingId: z.string().min(1),
  fighterId: z.string().min(1),
  position: z.number().int().min(1),
  points: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable()
});
