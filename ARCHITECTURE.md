# BOXXERA — Arquitectura

## Principio rector

BOXXERA es **infraestructura operativa y de identidad para el ecosistema del
boxeo profesional** — no un promotor, no un manager, no una liga, no una casa
de apuestas. Conecta boxeadores, gimnasios, comisiones, promotores, fans y
patrocinadores alrededor de un roster **verificable**.

La plataforma es **multi-tenant / multi-jurisdicción desde el día uno**. La
ciudad, estado o país nunca está hardcodeado en la lógica de negocio:

```
Country
 └── Region / State
      └── City
           └── Commission
                ├── Gym
                │    └── Fighter
                └── Fighter (directo, cuando aplica)
```

Una `Commission` administra únicamente su propia jurisdicción. Un
`COMMISSION_ADMIN` de Ciudad Juárez no puede editar información de una
comisión de Tijuana — esto se aplica en `src/lib/rbac.ts`, no se confía a
cada endpoint recordarlo por su cuenta.

## Diagrama de entidades (alto nivel)

```
Country ──< Region ──< City ──< Commission ──< Gym ──< FighterGymHistory >── Fighter
                                     │                                          │
                                     ├──< License >───────────────────────────┤
                                     ├──< Ranking ──< RankingEntry >──────────┤
                                     ├──< Event ──< Fight >───────────────────┤ (fighterA / fighterB)
                                     └──< FightRecord >───────────────────────┤
                                                                               │
User ──(role, commissionId?, gymId?, fighterId?)                             ├──< VerificationLog
  └──< AuditLog                                                              ├──< FighterBenefit >── Benefit
                                                                               └──< CommunityMember (via User)

Sponsor ──< Sponsorship
```

Puntos de diseño importantes:

- **`FightRecord` es estructurado**, no texto libre. `Fighter.wins/losses/
  draws/koWins/totalFights` son **campos denormalizados recalculados**
  (`src/lib/record.ts`) — nunca la fuente de verdad. Si algún día los números
  no cuadran, el bug está en el recálculo, no en el dato manual.
- **Verificación como activo de primera clase.** Cualquier entidad relevante
  (empezando por `Fighter`) tiene `verificationStatus` +
  `VerificationLog`. El sello **BOXXERA Verified** es, junto con el roster
  público, el activo principal de la plataforma.
- **Nunca borrado físico de un fighter con historial** — se usa `status:
  INACTIVE` (soft delete). Ver `DELETE /api/fighters/:id`.
- **`FighterGymHistory`** conserva el historial de gimnasios de un boxeador
  aunque cambie de afiliación — nunca se pierde el pasado.
- **Relaciones por ID, nunca texto libre.** `fighter.gymId`, nunca
  `fighter.gym = "Gym X"` — normalización desde el schema, no un TODO futuro.

## RBAC

| Rol | Alcance |
|---|---|
| `SUPER_ADMIN` / `BOXERA_ADMIN` | Global — todas las jurisdicciones |
| `COMMISSION_ADMIN` | Solo su `commissionId` |
| `GYM_ADMIN` | Solo su `gymId` |
| `FIGHTER` | Solo su propio perfil (`fighterId`) |
| `PROMOTER` / `SPONSOR` / `COMMUNITY_MEMBER` | Lectura pública + funciones propias (fase 2) |

La lógica vive en `src/lib/rbac.ts` (`canManageCommission`, `canManageGym`,
`canManageFighter`, `canVerify`) y se invoca desde cada route handler antes de
mutar nada. El middleware (`src/middleware.ts`) solo protege la entrada a
`/dashboard`; la autorización fina siempre ocurre en el servidor.

## Por qué NO es esto (y por qué importa)

- **No organiza carteleras ni vende boletos propios** — `Event`/`Fight` son
  informativos: registran qué pasó o va a pasar, no significa que BOXXERA sea
  el promotor. Esto evita competir con los promotores existentes; el roster
  verificado les sirve a ellos también.
- **No es la plataforma médica** — `Benefit` con `category: HEALTH` es un
  beneficio entre varios (junto a `PHARMACY`, `LEGAL`), no el propósito
  central. Casos complejos se refieren fuera del sistema.
- **No promete retorno financiero a nadie** — no hay modelo de inversión ni
  revenue-share en el dominio; `Sponsorship` es patrocinio con reconocimiento,
  no participación societaria.

## Stack

- **Next.js 14** (App Router) + TypeScript — monolito modular, no
  microservicios desde el día uno.
- **PostgreSQL** + **Prisma** como ORM.
- **Auth.js (NextAuth)** con proveedor de credenciales; sesión JWT con
  `role`, `commissionId`, `gymId`, `fighterId` embebidos para RBAC sin
  consultas extra.
- **Tailwind CSS** con tokens de marca propios (`tailwind.config.ts`) —
  estética sobria inspirada en Stripe/Linear/Notion, sin gradients ni neón.

## Digital Fight & Event Engine (Fase 2)

Sobre la base de V1 (sin tocarla), se agregó el motor que responde: *"¿Qué
pelea podemos hacer, por qué tiene sentido y cuánto dinero puede generar?"*

```
Fighter → FightOpportunity → Fight → Event → EventCost/EventRevenue → P&L
```

- **`FightOpportunity`** — relaciona dos boxeadores existentes, corre reglas de
  validación (`lib/engine/opportunityValidation.ts`) y el motor de matchmaking
  (`lib/engine/matchmaking.ts`), que calcula 4 scores (deportivo, comercial,
  logística, económico) + una explicación legible. Nunca aprueba nada por su
  cuenta — solo recomienda.
- **Conversión a `Fight`** — solo cuando la oportunidad está `APPROVED`, y solo
  copia información estructural (boxeadores, categoría, evento). El estado
  económico de la oportunidad se queda como historial, no se copia.
- **`Fight` extendido** — bolsas, y tres aprobaciones independientes
  (`commissionStatus`, `medicalStatus`, `contractStatus`). El estado
  `CONFIRMED` está bloqueado a nivel de API hasta que las tres estén
  `APPROVED` — es la regla de *human-in-the-loop* aplicada en código, no solo
  en la UI.
- **`Event` extendido + `EventCost`/`EventRevenue`** — el P&L
  (`lib/engine/eventEconomics.ts`) sigue el mismo principio que
  `lib/record.ts`: se recalcula siempre desde el detalle, nunca se guarda un
  total editable a mano. Todo monto lleva una `DataConfidence`
  (`CONFIRMED`/`ESTIMATED`/`ASSUMED`/`PROPOSED`) para no confundir proyección
  con realidad.
- **`lib/engine/whatIf.ts`** — escenarios BASE/OPTIMISTA/CONSERVADOR/CUSTOM,
  función pura que nunca escribe a la base de datos.
- **Rol `PROMOTER`** (ya existía en el enum) ahora tiene su propio dashboard
  (`/dashboard/promoter`) y puede crear oportunidades/eventos dentro de su
  propio alcance vía `canManageOpportunity`/`canManageEvent`
  (`lib/rbac.ts`).
- **Event Command Center** (`/dashboard/events`) — dinero agregado, peleas por
  estado, y una lista de riesgos derivada (falta de aprobación, brecha de
  ingreso cerca de la fecha del evento).

Lo que el brief pidió NO construir todavía (autonomous AI real, ticketing
completo, PPV, streaming, CRM completo) sigue fuera de alcance — ver
`ARCHITECTURE_REPORT_PHASE1.md` para el detalle de fases restantes.

## Membresía, sponsors, apoyo y Orchestrator (esta fase)

- **`BoxerMembership`** — el boxeador sí paga (corrección explícita sobre
  versiones anteriores de este documento): $50 MXN/mes configurable
  (`src/lib/config.ts`, nunca hardcodeado). No convierte a BOXXERA en
  manager ni le da control sobre la carrera del boxeador — es pertenencia,
  no inversión ni revenue-share.
- **`Sponsorship` evolucionado** (no duplicado) — pipeline
  `DISCOVERED → INTERESTED → CONTACTED → NEGOTIATING → CONFIRMED → LOST`,
  ligado a boxeador y/o evento, con monto propuesto vs. confirmado y un
  responsable de BOXXERA. Un usuario `SPONSOR` solo puede mover su propio
  registro a `INTERESTED` — todo lo demás es trabajo del equipo.
- **"Mi Apoyo BOXXERA"** — reutiliza `Task` (no se creó una entidad nueva),
  con `requestType` + `fighterId`. Es navegación y coordinación, nunca un
  expediente clínico o legal.
- **`lib/engine/orchestrator.ts`** — el BOXXERA Orchestrator: determinístico
  y auditable, siete funciones (`generateFightRecommendations`,
  `generateEventRecommendations`, `generateOperationalAlerts`,
  `generateMembershipAlerts`, `generateMedicalSupportAlerts`,
  `generateLegalSupportAlerts`, `generateSponsorOpportunities`) que leen
  datos reales y aplican umbrales fijos — nunca generan texto libre ni
  aprueban nada. Alimenta las "Acciones prioritarias" del Command Center.
- **Dashboard principal → BOXXERA Command Center** — la pregunta que
  responde primero es "¿qué necesita pasar ahora?", no una lista de
  métricas.

## Roadmap (resumen)

- **V1 (esta base):** auth, roles, fighters, gyms, commissions, licenses,
  records, rankings, verification, perfiles públicos, roster público,
  dashboard, audit log.
- **V1.5:** benefits, sponsors, community members, events/fights,
  notificaciones, alertas de vencimiento de documentos.
- **V2:** membresías + Stripe, portal de patrocinadores, portal de
  promotores, analítica, mensajería, credencial digital / QR.
- **V3:** verificación asistida por IA, matchmaking inteligente, motor de

  recomendación, red binacional, API para socios.
