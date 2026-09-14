# BOXXERA

**Professional Boxing Infrastructure.** *The new era of professional boxing.*

Plataforma digital y administrativa para el boxeo profesional — roster
verificable, comisiones, gimnasios, licencias, rankings y beneficios,
arquitectada para escalar de Ciudad Juárez a cualquier ciudad/comisión sin
reconstruirse desde cero.

Ver `ARCHITECTURE.md` para el diagrama de entidades y las decisiones de
diseño (por qué es infraestructura y no un promotor/manager/liga).

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (local o administrado)

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# edita .env con tu DATABASE_URL real y un NEXTAUTH_SECRET
# (genera uno con: openssl rand -base64 32)

# 3. Generar el cliente de Prisma
npm run db:generate

# 4. Crear las tablas en la base de datos
npm run db:migrate

# 5. Cargar datos de ejemplo de Ciudad Juárez
npm run db:seed

# 6. Levantar el servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

## Usuarios de prueba (después de `db:seed`)

| Rol | Correo | Contraseña |
|---|---|---|
| BOXERA_ADMIN (global) | `admin@boxxera.com` | `boxxera2026` |
| COMMISSION_ADMIN (Cd. Juárez) | `comision@boxjuarez.mx` | `boxxera2026` |
| GYM_ADMIN (Aztecas Boxing Club) | `aztecas@boxxera.com` | `boxxera2026` |
| PROMOTER | `promotor@boxxera.com` | `boxxera2026` |
| SPONSOR (Frontera Energy Drink) | `sponsor@boxxera.com` | `boxxera2026` |
| FIGHTER (El Huracán Ramírez) | `boxeador@boxxera.com` | `boxxera2026` |

Todas son cuentas **DEMO** — no usar en producción.

El panel administrativo vive en `/dashboard` (requiere login). El roster
público y los perfiles de boxeadores son de acceso libre en `/roster` y
`/fighters/[slug]`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:generate` | Regenera el cliente de Prisma tras cambios al schema |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Carga los datos de ejemplo de Ciudad Juárez |
| `npm run db:studio` | Abre Prisma Studio (explorar/editar datos visualmente) |

## Estructura de carpetas

```
boxxera/
├── prisma/
│   ├── schema.prisma      # Todas las entidades (ver ARCHITECTURE.md)
│   └── seed.ts            # Datos de ejemplo de Ciudad Juárez
├── src/
│   ├── app/
│   │   ├── (público)       page.tsx, roster/, fighters/[slug]/, login/
│   │   ├── dashboard/       panel administrativo por rol
│   │   └── api/             fighters, commissions, gyms, licenses, rankings
│   ├── components/
│   │   ├── ui/               Button, Field (Input/Select/Textarea), Badge
│   │   ├── layout/           Sidebar, PublicNav
│   │   ├── fighters/          FighterForm, VerifyPanel
│   │   ├── commissions/, gyms/, licenses/, rankings/
│   ├── lib/
│   │   ├── prisma.ts          cliente singleton
│   │   ├── auth.ts            configuración de NextAuth
│   │   ├── session.ts         helper de sesión tipada
│   │   ├── rbac.ts            reglas de autorización por jurisdicción
│   │   ├── audit.ts           registro de auditoría
│   │   ├── record.ts          recálculo de récord (wins/losses/KOs)
│   │   ├── validation.ts      esquemas Zod
│   │   └── utils.ts           slugs, formato de fecha, cn()
│   └── middleware.ts         protege /dashboard/*
```

## Nota de seguridad antes de producción

`npm audit` señala vulnerabilidades conocidas de Next.js 14.x (DoS, SSRF,
smuggling) cuyo fix completo requiere Next 16, un salto mayor que toca la API
de rutas (`params`/`searchParams` como Promise) y la compatibilidad de
`next-auth` v4 con el App Router. No se hizo ese salto en esta V1 para no
introducir cambios sin poder probarlos a fondo aquí. **Antes de desplegar a
producción**, evalúa `npm audit fix --force` o una migración planeada a
Next 15/16 + `next-auth` v5 (Auth.js).

## Despliegue a staging

Ver **`DEPLOYMENT.md`** para las instrucciones paso a paso (Vercel + Postgres
administrado), pensadas para que cualquiera del equipo lo despliegue sin
tener que reconstruir nada.

## Próximos pasos sugeridos (no incluidos en esta fase)

- Integración real de pagos (Stripe) para la membresía del boxeador y los
  patrocinios — hoy `BoxerMembership` y `Sponsorship` se administran a mano
  desde el dashboard, no hay cobro automático
- Notificaciones automáticas (correo/WhatsApp) cuando el Orchestrator genera
  una alerta — hoy las alertas solo se ven al entrar al Command Center
- Credencial digital / QR del boxeador
- Ticketing real, streaming, PPV — deliberadamente fuera de alcance
- Internacionalización real (es/en) — el schema ya está preparado
  (`Country` MX/US desde el seed), falta la capa de traducciones en UI
