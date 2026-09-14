import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ============================================================================
// DATOS DE DEMOSTRACIÓN — NO ES EL PADRÓN OFICIAL
// Todo lo que este script crea es ficticio, para poder navegar y evaluar
// visualmente el producto en staging. Ningún boxeador, sponsor o membresía
// aquí es real. Antes de producción, este seed se reemplaza por el padrón
// real entregado por la H. Comisión de Boxeo Profesional de Ciudad Juárez.
// ============================================================================

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding BOXXERA — DATOS DE DEMOSTRACIÓN (Ciudad Juárez, ficticio)...");

  // --- Geography -----------------------------------------------------------
  const mexico = await prisma.country.upsert({
    where: { code: "MX" },
    update: {},
    create: { code: "MX", name: "México" }
  });

  const usa = await prisma.country.upsert({
    where: { code: "US" },
    update: {},
    create: { code: "US", name: "United States" }
  });

  const chihuahua = await prisma.region.upsert({
    where: { countryId_name: { countryId: mexico.id, name: "Chihuahua" } },
    update: {},
    create: { name: "Chihuahua", code: "CHH", countryId: mexico.id }
  });

  const texas = await prisma.region.upsert({
    where: { countryId_name: { countryId: usa.id, name: "Texas" } },
    update: {},
    create: { name: "Texas", code: "TX", countryId: usa.id }
  });

  const ciudadJuarez = await prisma.city.upsert({
    where: { regionId_name: { regionId: chihuahua.id, name: "Ciudad Juárez" } },
    update: {},
    create: { name: "Ciudad Juárez", regionId: chihuahua.id }
  });

  const chihuahuaCapital = await prisma.city.upsert({
    where: { regionId_name: { regionId: chihuahua.id, name: "Chihuahua" } },
    update: {},
    create: { name: "Chihuahua", regionId: chihuahua.id }
  });

  const elPaso = await prisma.city.upsert({
    where: { regionId_name: { regionId: texas.id, name: "El Paso" } },
    update: {},
    create: { name: "El Paso", regionId: texas.id }
  });

  // --- Commission ------------------------------------------------------------
  const commission = await prisma.commission.upsert({
    where: { id: "seed-comision-cdjuarez" },
    update: {},
    create: {
      id: "seed-comision-cdjuarez",
      name: "Comisión de Box Profesional de Ciudad Juárez",
      shortName: "CBP Cd. Juárez",
      cityId: ciudadJuarez.id,
      jurisdiction: "Ciudad Juárez, Chihuahua",
      contactEmail: "contacto@boxjuarez.mx"
    }
  });

  // --- Gyms --------------------------------------------------------------
  const gymAztecas = await prisma.gym.upsert({
    where: { id: "seed-gym-aztecas" },
    update: {},
    create: {
      id: "seed-gym-aztecas",
      name: "Gimnasio Aztecas Boxing Club",
      cityId: ciudadJuarez.id,
      commissionId: commission.id,
      address: "Av. Tecnológico, Ciudad Juárez",
      headCoach: "Ramón Reyes",
      status: "ACTIVE"
    }
  });

  const gymFrontera = await prisma.gym.upsert({
    where: { id: "seed-gym-frontera" },
    update: {},
    create: {
      id: "seed-gym-frontera",
      name: "Frontera Boxing Gym",
      cityId: ciudadJuarez.id,
      commissionId: commission.id,
      address: "Zona Centro, Ciudad Juárez",
      headCoach: "Beto Salcido",
      status: "ACTIVE"
    }
  });

  // --- Users ---------------------------------------------------------------
  const passwordHash = await bcrypt.hash("boxxera2026", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@boxxera.com" },
    update: {},
    create: {
      email: "admin@boxxera.com",
      passwordHash,
      name: "BOXXERA Admin",
      role: "BOXERA_ADMIN"
    }
  });

  await prisma.user.upsert({
    where: { email: "comision@boxjuarez.mx" },
    update: {},
    create: {
      email: "comision@boxjuarez.mx",
      passwordHash,
      name: "Comisión de Box Cd. Juárez",
      role: "COMMISSION_ADMIN",
      commissionId: commission.id
    }
  });

  await prisma.user.upsert({
    where: { email: "aztecas@boxxera.com" },
    update: {},
    create: {
      email: "aztecas@boxxera.com",
      passwordHash,
      name: "Gimnasio Aztecas",
      role: "GYM_ADMIN",
      gymId: gymAztecas.id
    }
  });

  // --- Fighters --------------------------------------------------------------
  const fightersData = [
    {
      slug: "el-huracan-ramirez",
      fullName: "Jesús Ramírez Domínguez",
      publicName: "El Huracán Ramírez",
      gender: "MALE" as const,
      weightClass: "Superligero",
      gymId: gymAztecas.id,
      wins: 12,
      losses: 1,
      draws: 0,
      koWins: 8,
      verificationStatus: "VERIFIED" as const
    },
    {
      slug: "kid-frontera",
      fullName: "Adrián Molina Ruiz",
      publicName: "Kid Frontera",
      gender: "MALE" as const,
      weightClass: "Wélter",
      gymId: gymFrontera.id,
      wins: 8,
      losses: 2,
      draws: 1,
      koWins: 5,
      verificationStatus: "VERIFIED" as const
    },
    {
      slug: "la-reina-del-paso",
      fullName: "Karina Ponce Léon",
      publicName: "La Reina del Paso",
      gender: "FEMALE" as const,
      weightClass: "Pluma",
      gymId: gymAztecas.id,
      wins: 6,
      losses: 0,
      draws: 0,
      koWins: 3,
      verificationStatus: "VERIFIED" as const
    },
    {
      slug: "el-relampago-soto",
      fullName: "Iván Soto Hernández",
      publicName: "El Relámpago Soto",
      gender: "MALE" as const,
      weightClass: "Gallo",
      gymId: gymFrontera.id,
      wins: 4,
      losses: 1,
      draws: 0,
      koWins: 2,
      verificationStatus: "PENDING" as const
    },
    {
      slug: "joven-promesa-alvarez",
      fullName: "Diego Álvarez Nuñez",
      publicName: "Joven Promesa Álvarez",
      gender: "MALE" as const,
      weightClass: "Ligero",
      gymId: gymAztecas.id,
      wins: 2,
      losses: 0,
      draws: 0,
      koWins: 2,
      verificationStatus: "UNVERIFIED" as const
    }
  ];

  const fighters = [];
  for (const f of fightersData) {
    const fighter = await prisma.fighter.upsert({
      where: { slug: f.slug },
      update: {},
      create: {
        slug: f.slug,
        fullName: f.fullName,
        publicName: f.publicName,
        gender: f.gender,
        weightClass: f.weightClass,
        cityId: ciudadJuarez.id,
        commissionId: commission.id,
        gymId: f.gymId,
        status: "ACTIVE",
        wins: f.wins,
        losses: f.losses,
        draws: f.draws,
        koWins: f.koWins,
        totalFights: f.wins + f.losses + f.draws,
        verificationStatus: f.verificationStatus,
        verifiedAt: f.verificationStatus === "VERIFIED" ? new Date() : null
      }
    });
    fighters.push(fighter);

    await prisma.fighterGymHistory.upsert({
      where: { id: `hist-${fighter.id}` },
      update: {},
      create: { id: `hist-${fighter.id}`, fighterId: fighter.id, gymId: f.gymId, current: true }
    });

    await prisma.license.upsert({
      where: { licenseNumber: `CBP-${f.slug.toUpperCase()}` },
      update: {},
      create: {
        licenseNumber: `CBP-${f.slug.toUpperCase()}`,
        fighterId: fighter.id,
        commissionId: commission.id,
        type: "professional",
        issuedAt: new Date("2025-01-15"),
        expiresAt: new Date("2026-12-31"),
        status: "ACTIVE"
      }
    });
  }

  // --- Fighter-role demo login (linked to an actual Fighter row) ------------
  await prisma.user.upsert({
    where: { email: "boxeador@boxxera.com" },
    update: {},
    create: {
      email: "boxeador@boxxera.com",
      passwordHash,
      name: fighters[0].publicName,
      role: "FIGHTER",
      fighterId: fighters[0].id
    }
  });

  // --- Fight records for the two most established fighters -----------------
  await prisma.fightRecord.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "seed-fr-1",
        fighterId: fighters[0].id,
        date: new Date("2025-11-08"),
        opponentName: "Marco Villalobos",
        result: "WIN",
        method: "KO",
        round: 4,
        city: "Ciudad Juárez",
        country: "México",
        eventName: "Noche de Campeones Juárez",
        commissionId: commission.id,
        verificationStatus: "VERIFIED"
      },
      {
        id: "seed-fr-2",
        fighterId: fighters[1].id,
        date: new Date("2025-09-20"),
        opponentName: "Luis Barraza",
        result: "WIN",
        method: "DECISION",
        round: 8,
        city: "El Paso",
        country: "USA",
        eventName: "Border Fight Night",
        verificationStatus: "VERIFIED"
      }
    ]
  });

  // --- Ranking ---------------------------------------------------------------
  const ranking = await prisma.ranking.upsert({
    where: { id: "seed-ranking-superligero" },
    update: {},
    create: {
      id: "seed-ranking-superligero",
      commissionId: commission.id,
      weightClass: "Superligero",
      region: "Ciudad Juárez",
      period: "2026-Q3"
    }
  });

  await prisma.rankingEntry.upsert({
    where: { rankingId_fighterId: { rankingId: ranking.id, fighterId: fighters[0].id } },
    update: {},
    create: { rankingId: ranking.id, fighterId: fighters[0].id, position: 1, points: 100 }
  });

  // --- Benefits ----------------------------------------------------------
  const benefits = await Promise.all([
    prisma.benefit.upsert({
      where: { id: "seed-benefit-farmacia" },
      update: {},
      create: {
        id: "seed-benefit-farmacia",
        name: "Farmacia a precio de proveedor",
        category: "PHARMACY",
        providerName: "Farmacia Fronteriza",
        city: "Ciudad Juárez",
        country: "México",
        description: "Compra de medicamentos a costo de proveedor para boxeadores verificados."
      }
    }),
    prisma.benefit.upsert({
      where: { id: "seed-benefit-consulta" },
      update: {},
      create: {
        id: "seed-benefit-consulta",
        name: "Consulta médica preferencial ($100 MXN)",
        category: "HEALTH",
        providerName: "Red médica aliada",
        city: "Ciudad Juárez",
        country: "México",
        description: "Consulta general a tarifa preferencial. Casos que requieran cirugía se refieren a la red de salud especializada."
      }
    }),
    prisma.benefit.upsert({
      where: { id: "seed-benefit-legal" },
      update: {},
      create: {
        id: "seed-benefit-legal",
        name: "Asesoría legal básica",
        category: "LEGAL",
        providerName: "Despacho aliado",
        city: "Ciudad Juárez",
        country: "México",
        description: "Revisión de contratos y orientación legal para boxeadores del roster."
      }
    })
  ]);

  for (const fighter of fighters.slice(0, 3)) {
    for (const benefit of benefits) {
      await prisma.fighterBenefit.upsert({
        where: { fighterId_benefitId: { fighterId: fighter.id, benefitId: benefit.id } },
        update: {},
        create: { fighterId: fighter.id, benefitId: benefit.id }
      });
    }
  }

  // --- Fight & Event Engine: promoter user + one worked example ------------
  const promoter = await prisma.user.upsert({
    where: { email: "promotor@boxxera.com" },
    update: {},
    create: {
      email: "promotor@boxxera.com",
      passwordHash,
      name: "Promotor Demo",
      role: "PROMOTER"
    }
  });

  const opportunity = await prisma.fightOpportunity.upsert({
    where: { id: "seed-opportunity-1" },
    update: {},
    create: {
      id: "seed-opportunity-1",
      fighterAId: fighters[0].id, // El Huracán Ramírez
      fighterBId: fighters[1].id, // Kid Frontera
      weightClass: "Superligero",
      proposedCity: "Ciudad Juárez",
      proposedVenue: "Auditorio Municipal Benito Juárez",
      commissionId: commission.id,
      source: "BOXXERA",
      createdById: promoter.id,
      status: "APPROVED",
      sportingScore: 78,
      commercialScore: 74,
      logisticsScore: 91,
      economicScore: 68,
      totalScore: 78,
      dataConfidence: "ASSUMED",
      estimatedCost: 345000,
      estimatedRevenue: 480000,
      estimatedProfit: 135000,
      explanation: {
        sporting: { score: 78, reasons: ["Categorías compatibles", "Experiencia comparable"] },
        commercial: { score: 74, reasons: ["Sin datos de audiencia — score conservador"] },
        logistics: { score: 91, reasons: ["Misma ciudad — bajo costo de viaje", "Misma comisión"] },
        economics: { score: 68, projectedRevenue: 480000, projectedCost: 345000, projectedProfit: 135000, reasons: ["Utilidad proyectada positiva con los supuestos actuales"] },
        overall: { score: 78, recommendation: "viable" }
      }
    }
  });

  const event = await prisma.event.upsert({
    where: { id: "seed-event-1" },
    update: {},
    create: {
      id: "seed-event-1",
      name: "Noche de Campeones Juárez — Edición Frontera",
      date: new Date("2026-11-14"),
      city: "Ciudad Juárez",
      venue: "Auditorio Municipal Benito Juárez",
      commissionId: commission.id,
      promoterId: promoter.id,
      eventOwner: "EXTERNAL_PROMOTER",
      capacity: 4000,
      expectedAttendance: 2500,
      status: "SCHEDULED"
    }
  });

  await prisma.fightOpportunity.update({
    where: { id: opportunity.id },
    data: { eventId: event.id }
  });

  await prisma.fight.upsert({
    where: { id: "seed-fight-1" },
    update: {},
    create: {
      id: "seed-fight-1",
      eventId: event.id,
      fighterAId: fighters[0].id,
      fighterBId: fighters[1].id,
      weightClass: "Superligero",
      status: "PENDING_COMMISSION",
      purseA: 60000,
      purseB: 45000,
      commissionStatus: "PENDING",
      medicalStatus: "PENDING",
      contractStatus: "PENDING",
      opportunityId: opportunity.id
    }
  });

  await prisma.eventCost.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-cost-1", eventId: event.id, category: "FIGHTER_PURSE", description: "Bolsas estelares", amount: 105000, confidence: "CONFIRMED", status: "PLANNED" },
      { id: "seed-cost-2", eventId: event.id, category: "VENUE", description: "Renta del auditorio", amount: 80000, confidence: "CONFIRMED", status: "PAID", paidAt: new Date("2026-09-01") },
      { id: "seed-cost-3", eventId: event.id, category: "MEDICAL", description: "Equipo médico ringside", amount: 15000, confidence: "ESTIMATED", status: "PLANNED" },
      { id: "seed-cost-4", eventId: event.id, category: "PRODUCTION", description: "Producción y transmisión", amount: 60000, confidence: "ESTIMATED", status: "PLANNED" },
      { id: "seed-cost-5", eventId: event.id, category: "MARKETING", description: "Campaña de boletaje", amount: 25000, confidence: "ASSUMED", status: "PLANNED" }
    ]
  });

  await prisma.eventRevenue.createMany({
    skipDuplicates: true,
    data: [
      { id: "seed-rev-1", eventId: event.id, category: "TICKETS", description: "Preventa boletaje general", amount: 180000, confidence: "CONFIRMED", status: "RECEIVED", receivedAt: new Date("2026-09-05") },
      { id: "seed-rev-2", eventId: event.id, category: "SPONSORSHIP", description: "Patrocinador principal", amount: 150000, confidence: "ESTIMATED", status: "PENDING" },
      { id: "seed-rev-3", eventId: event.id, category: "STREAMING", description: "Transmisión por internet", amount: 40000, confidence: "ASSUMED", status: "PLANNED" }
    ]
  });

  // --- Boxer memberships (DEMO) --------------------------------------------
  await prisma.boxerMembership.upsert({
    where: { fighterId: fighters[0].id },
    update: {},
    create: {
      fighterId: fighters[0].id,
      monthlyPrice: 50,
      currency: "MXN",
      status: "ACTIVE",
      paymentStatus: "PAID",
      startDate: new Date("2026-01-15"),
      renewalDate: new Date("2026-10-15"),
      lastPaymentDate: new Date("2026-09-15")
    }
  });
  await prisma.boxerMembership.upsert({
    where: { fighterId: fighters[3].id },
    update: {},
    create: {
      fighterId: fighters[3].id,
      monthlyPrice: 50,
      currency: "MXN",
      status: "PENDING",
      paymentStatus: "PENDING"
    }
  });

  // --- Sponsor + pipeline (DEMO) --------------------------------------------
  const sponsor = await prisma.sponsor.upsert({
    where: { id: "seed-sponsor-1" },
    update: {},
    create: {
      id: "seed-sponsor-1",
      companyName: "Frontera Energy Drink",
      contactName: "Marisol Treviño",
      contactEmail: "marisol@fronteraenergy.mx",
      industry: "Bebidas",
      city: "Ciudad Juárez"
    }
  });

  const sponsorUser = await prisma.user.upsert({
    where: { email: "sponsor@boxxera.com" },
    update: {},
    create: {
      email: "sponsor@boxxera.com",
      passwordHash,
      name: "Frontera Energy Drink",
      role: "SPONSOR",
      sponsorId: sponsor.id
    }
  });

  await prisma.sponsorship.upsert({
    where: { id: "seed-sponsorship-1" },
    update: {},
    create: {
      id: "seed-sponsorship-1",
      sponsorId: sponsor.id,
      program: "Patrocinio principal — Noche de Campeones Juárez",
      eventId: event.id,
      proposedAmount: 150000,
      currency: "MXN",
      benefits: "Logo en lona del ring, mención en transmisión, activación en entrada",
      responsibleId: adminUser.id,
      status: "NEGOTIATING",
      notes: "En pláticas, esperando confirmación de presupuesto trimestral."
    }
  });
  await prisma.sponsorship.upsert({
    where: { id: "seed-sponsorship-2" },
    update: {},
    create: {
      id: "seed-sponsorship-2",
      sponsorId: sponsor.id,
      program: "Patrocinio individual — El Huracán Ramírez",
      fighterId: fighters[0].id,
      proposedAmount: 20000,
      currency: "MXN",
      responsibleId: adminUser.id,
      status: "INTERESTED"
    }
  });

  // --- Mi Apoyo BOXXERA — solicitudes de ejemplo (DEMO) ---------------------
  await prisma.task.upsert({
    where: { id: "seed-support-medical-1" },
    update: {},
    create: {
      id: "seed-support-medical-1",
      title: "Tengo una lesión",
      category: "medical",
      requestType: "LESION",
      fighterId: fighters[1].id,
      notes: "Molestia en la mano derecha después del último entrenamiento.",
      status: "OPEN"
    }
  });
  await prisma.task.upsert({
    where: { id: "seed-support-legal-1" },
    update: {},
    create: {
      id: "seed-support-legal-1",
      title: "Tengo una duda sobre mi contrato",
      category: "legal",
      requestType: "DUDA_CONTRATO",
      fighterId: fighters[2].id,
      notes: "Duda sobre la cláusula de exclusividad con el gimnasio.",
      status: "IN_PROGRESS"
    }
  });

  console.log("Seed complete.");
  console.log("Login de prueba (DEMO — no usar en producción):");
  console.log("  admin@boxxera.com / boxxera2026 (BOXERA_ADMIN)");
  console.log("  comision@boxjuarez.mx / boxxera2026 (COMMISSION_ADMIN)");
  console.log("  aztecas@boxxera.com / boxxera2026 (GYM_ADMIN)");
  console.log("  promotor@boxxera.com / boxxera2026 (PROMOTER)");
  console.log(`  sponsor@boxxera.com / boxxera2026 (SPONSOR — ${sponsorUser.name})`);
  console.log("  boxeador@boxxera.com / boxxera2026 (FIGHTER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
