# BOXXERA — Reporte de arquitectura actual y análisis de brechas

**Fase 1 del roadmap "Digital Fight & Event Engine".** Este documento audita lo
que ya existe antes de escribir una sola línea de código nuevo, tal como pide
el brief. Nada de lo listado en la Sección 1 se elimina ni se reconstruye.

---

## 1. Arquitectura actual (lo que ya existe y funciona)

### Stack
Next.js 14 (App Router) + TypeScript, PostgreSQL + Prisma, Auth.js
(credenciales, sesión JWT con rol/jurisdicción embebidos), Tailwind. Monolito
modular — sin microservicios.

### Modelos de datos existentes (`prisma/schema.prisma`, 535 líneas)

| Dominio | Entidades ya construidas |
|---|---|
| Geografía multi-jurisdicción | `Country → Region → City` |
| Identidad y acceso | `User` (roles: `SUPER_ADMIN`, `BOXERA_ADMIN`, `COMMISSION_ADMIN`, `GYM_ADMIN`, `FIGHTER`, **`PROMOTER`**, **`SPONSOR`**, `COMMUNITY_MEMBER` — los roles de promotor/sponsor **ya están en el enum**, solo no tienen dashboard ni permisos construidos aún) |
| Núcleo del ecosistema | `Commission`, `Gym`, `Fighter`, `FighterGymHistory`, `FightRecord` (estructurado, con recálculo automático de récord en `lib/record.ts`), `License`, `Ranking`/`RankingEntry`, `VerificationLog` |
| Beneficios y comunidad | `Benefit`/`FighterBenefit`, `CommunityMember` |
| Patrocinio (stub básico) | `Sponsor`, `Sponsorship` (campo `amount`/`currency`/`status`, **sin** paquetes ni deliverables granulares) |
| Eventos (informativo, no económico) | `Event` (nombre, fecha, ciudad, venue, comisión, promotor como texto libre, status), `Fight` (evento, fighter A/B, categoría, resultado, método, round — **sin bolsas, sin estados de comisión/médico/contrato**) |
| Trazabilidad | `AuditLog` genérico por `entityType`/`entityId` — no necesita cambios para soportar entidades nuevas |

### Endpoints existentes
`/api/fighters` (+ `[id]`, `+/verify`), `/api/commissions` (+ `[id]`),
`/api/gyms` (+ `[id]`), `/api/licenses`, `/api/rankings` (+ `[id]/entries`).
Todos con scoping de jurisdicción vía `lib/rbac.ts` y auditoría vía
`lib/audit.ts`.

### Dashboards y páginas existentes
Público: landing, `/roster` (filtros), `/fighters/[slug]`. Panel: login,
`/dashboard` (resumen distinto por rol: admin global, comisión, boxeador),
CRUD completo de fighters/gyms/commissions, alta de licencias y rankings,
`/dashboard/audit`.

### Piezas reutilizables clave
- `lib/rbac.ts` — `canManageCommission/Gym/Fighter`, `canVerify`, `isGlobalAdmin`. Ya diseñado para extenderse a un rol nuevo sin reescribir nada.
- `lib/audit.ts` — genérico, funciona para cualquier entidad nueva de inmediato.
- `lib/record.ts` — patrón de "recalcular desde el detalle, nunca confiar en el total manual" — el mismo patrón que pide el brief para el P&L de eventos.
- El patrón `status` + `VerificationLog`/`AuditLog` ya implementa "ninguna acción sensible se autoaprueba" — es el mismo patrón de *human-in-the-loop* que pide la nueva tesis, solo hay que replicarlo en las entidades nuevas.
- Kit de UI (`Button`, `Field`, `Badge`, `Card`) y el patrón de formulario cliente + API route + RBAC + audit — se reutiliza tal cual para cada entidad nueva.

---

## 2. Qué de la nueva tesis ya está parcialmente cubierto

- **`Event` y `Fight` ya existen** — pero son informativos (qué pasó/va a pasar), no económicos. Se **extienden**, no se recrean.
- **`Sponsor`/`Sponsorship` ya existen** — falta la granularidad de paquetes/deliverables/estados de negociación que pide el brief.
- **El rol `PROMOTER` ya está en el schema** — falta el dashboard y los permisos específicos.
- **Multi-moneda ya contemplado** — `Sponsorship.currency` ya existe como patrón; se repite en las entidades de dinero nuevas.

---

## 3. Gap analysis — qué falta para el Digital Fight & Event Engine

### Entidades completamente nuevas (no existe nada parecido)
| Entidad | Depende de |
|---|---|
| `FightOpportunity` (con scores deportivo/comercial/logístico/económico) | `Fighter` (existente) |
| Motor de matchmaking (cálculo de scores + explicación) | `FightOpportunity` |
| `EventCost` / `EventRevenue` | `Event` (existente, a extender) |
| Motor de P&L de evento (gross profit, margen, proyectado vs. real, break-even) | `EventCost`/`EventRevenue` |
| `SponsorshipPackage` / `SponsorshipDeal` | `Sponsor` (existente, a extender) |
| `TicketType` / `TicketSale` | `Event` |
| `Activation` | `Event` + `Sponsor` |
| Vista de economía del boxeador (bolsa, viáticos, neto) | `Fight` (a extender) |
| Capa `BOXXERA ORCHESTRATOR` (recomendaciones, "what if") | Todo lo anterior + histórico |

### Extensiones a entidades existentes (no se recrean, se amplían)
- `Fight`: agregar `purse_a`, `purse_b`, `status` (workflow completo), `commission_status`, `medical_status`, `contract_status`.
- `Event`: agregar `capacity`, `expected_attendance`, `promoter` (relación real, no texto libre), `event_owner` (`EXTERNAL_PROMOTER` / `BOXXERA` / `CO_PRODUCED`).
- `Sponsorship`: dividir en `SponsorshipPackage` (catálogo) + `SponsorshipDeal` (acuerdo concreto), con `revenue_share_type`/`percentage`/`fixed_fee` configurables — nunca hardcodeados, tal como pide el brief.

### Funcionalidad nueva sin entidad propia
- Rol y dashboard de `PROMOTER` (el rol ya existe, falta todo lo demás).
- Event Command Center (agregador de los dashboards anteriores).
- Automatizaciones disparadas por cambio de estado (aprobar pelea → crear tareas médicas/comisión/contrato/sponsor; cambiar bolsa → recalcular P&L).
- Simulación de escenarios ("what if").

---

## 4. Decisiones y riesgos a resolver antes de codear

1. **Human-in-the-loop no es nuevo, ya es el patrón del sistema** — cada entidad nueva sensible (`FightOpportunity`, `Fight`, `Sponsorship Deal`) debe arrancar en un estado no-aprobado y exponer un endpoint de aprobación explícita, exactamente como `/api/fighters/[id]/verify` ya lo hace. No se automatiza ninguna aprobación final.
2. **Revenue share configurable** — necesita un modelo genérico (`revenue_share_type`, `percentage`, `fixed_fee`, `currency`, `payer`, `recipient`) reutilizable entre `SponsorshipDeal`, `TicketSale` y la economía del boxeador — no un porcentaje fijo en código.
3. **La bolsa del boxeador nunca se retiene automáticamente** — cualquier % que tome BOXXERA debe ser explícito y contractual, visible en la vista de economía del boxeador. Esto es independiente de la membresía mensual ($50 MXN) que sí paga el boxeador por pertenecer — una cosa es la membresía simbólica, otra muy distinta sería tomar % de la bolsa sin contrato explícito, y eso último sigue prohibido.
4. **Nada de lo existente se toca** — fighters, gyms, commissions, licenses, rankings, verification y sus dashboards siguen intactos; el motor nuevo se construye *sobre* ellos, no en reemplazo.

---

## 5. Fase 2 — orden de construcción recomendado

Priorizado por menor dependencia de piezas aún no construidas:

1. `FightOpportunity` (entidad + CRUD + estados) — solo depende de `Fighter`, ya existente.
2. Motor de matchmaking (scores + explicación) sobre `FightOpportunity`.
3. Extender `Fight` (bolsas + estados de comisión/médico/contrato).
4. Extender `Event` (capacidad, promotor real, `event_owner`).
5. `EventCost` + `EventRevenue` + motor de P&L/break-even.
6. `SponsorshipPackage`/`SponsorshipDeal` sobre el `Sponsor` ya existente.
7. `TicketType`/`TicketSale`.
8. Rol y dashboard de `PROMOTER` (el rol ya existe en el enum).
9. Event Command Center (agrega todo lo anterior en un dashboard).
10. Orchestrator/recomendaciones — fase 3, requiere histórico acumulado de los pasos 1–9.

---

**Siguiente paso:** con este mapa confirmado, la Fase 2 empieza por `FightOpportunity` — es la pieza con menos dependencias y la que desbloquea todo lo demás (matchmaking, y de ahí Fight/Event extendidos).
