# BOXXERA — Guía de despliegue a STAGING

Escrita para que **Adrián** (o cualquier desarrollador) pueda desplegar esto
directo, sin tener que entender ni reconstruir el proyecto primero.

**No conectes `boxxera.com` todavía.** Esta guía es para una URL temporal de
Vercel o `staging.boxxera.com`. El dominio principal se conecta hasta que
alguien del equipo apruebe visualmente y funcionalmente lo que hay en
staging.

---

## 1. Crear el proyecto en Vercel

1. Entra a [vercel.com](https://vercel.com) con la cuenta del equipo.
2. **Add New → Project**.
3. Si el código está en GitHub/GitLab: conecta el repositorio. Si no,
   sube el folder del proyecto directo (`vercel` CLI: `vercel --prod=false`
   desde la raíz del proyecto también funciona para un primer deploy).
4. Framework detectado: **Next.js** (debería ser automático).

## 2. Configurar PostgreSQL

Recomendado: **Neon** o **Supabase** (ambos tienen tier gratuito, suficiente
para staging).

1. Crea una base de datos nueva ahí.
2. Copia el **connection string** completo (incluye usuario, password, host,
   puerto, nombre de base, y `?sslmode=require` si lo pide el proveedor).

## 3. Variables de entorno en Vercel

En el proyecto de Vercel → **Settings → Environment Variables**, agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | El connection string del paso 2 |
| `NEXTAUTH_SECRET` | Genera uno con `openssl rand -base64 32` — nunca reutilices el de desarrollo |
| `NEXTAUTH_URL` | La URL que Vercel te da (ej. `https://boxxera-staging.vercel.app`) — actualízala si cambia |
| `NEXT_PUBLIC_APP_NAME` | `BOXXERA` |
| `NEXT_PUBLIC_DEFAULT_COUNTRY` | `MX` |

No hace falta ninguna variable de Stripe/pagos en esta fase — la membresía y
los patrocinios se administran manualmente desde el dashboard, no hay cobro
automático todavía (ver README, sección "Próximos pasos").

Marca las variables para los tres entornos (Production, Preview, Development)
si vas a usar Preview Deployments de Vercel para revisar PRs.

## 4. Migraciones de Prisma

**Ya incluidas y validadas en este ZIP** — `prisma/migrations/20260913000000_init/migration.sql`.

Cómo se generó y validó (transparencia total): el entorno donde se escribió
este proyecto no tiene salida de red hacia el CDN de binarios de Prisma, así
que no se pudo correr `prisma migrate dev` para generarla automáticamente.
En su lugar: se escribió `scripts/gen_migration.py`, que parsea
`schema.prisma` y genera el SQL equivalente, y **se validó aplicándola
contra una instancia real de PostgreSQL 16** (instalada en el entorno de
desarrollo) — se corrigieron 2 bugs reales del generador en el proceso (el
primero convertía todos los campos de un modelo en relaciones por error; el
segundo interpretaba los defaults de texto como referencias a columnas en
vez de strings). Resultado final verificado:

- Las 27 tablas se crean sin error
- Las 50 llaves foráneas y 41 restricciones únicas/primarias quedan
  correctamente aplicadas
- Se probó una inserción real encadenada (`Country → Region → City →
  Commission → Fighter → BoxerMembership`) — funciona
- Se probó que una llave foránea inválida **se rechaza correctamente**

Desde tu máquina (o CI), apuntando al `DATABASE_URL` de staging:

```bash
npx prisma migrate deploy
```

Esto aplica `prisma/migrations/20260913000000_init/migration.sql` contra la
base de staging. Como el SQL ya fue validado directamente contra Postgres
real (no solo generado a ciegas), la confianza aquí es alta — pero esta sigue
siendo la primera vez que se ejecuta a través del propio CLI de Prisma
(`migrate deploy` además registra la migración en la tabla
`_prisma_migrations`), así que igual vale la pena confirmar que corre limpio
antes de seguir.

## 5. Seed de demostración

```bash
npm run db:seed
```

Esto carga el padrón **DEMO** de Ciudad Juárez (ficticio, marcado como tal en
el propio script) — boxeadores, gimnasios, comisión, una oportunidad, un
evento con costos/ingresos, sponsors, membresías, y solicitudes de apoyo
médico/legal de ejemplo. Ver la sección "Usuarios de prueba" del `README.md`
para las credenciales.

**Nunca corras este seed contra la base de producción real** — está pensado
solo para poder navegar y evaluar el producto.

## 6. Verificar el build — secuencia exacta a correr

**Esta secuencia es obligatoria y en este orden, antes de dar por bueno el
deploy:**

```bash
npm ci
npx prisma generate
npx prisma validate
npm run build
```

**Por qué en este orden importa (lee esto antes de reportar un error):** el
`@prisma/client` que trae el repo de fábrica es un stub genérico sin los
tipos de `Fighter`, `Commission`, etc. — esos tipos solo existen después de
`npx prisma generate`. Si corres `npm run build` antes de generar el
cliente, **vas a ver errores de TypeScript del estilo**
`Parameter 'x' implicitly has an 'any' type` en decenas de archivos bajo
`src/app/dashboard/**` y `src/app/**` que hacen `.map()` sobre resultados de
Prisma (`fighters.map(...)`, `commissions.map(...)`, `events.map(...)`,
etc.). **Esto es esperado y no es un bug** — desaparece en cuanto
`prisma generate` corrió con éxito, porque entonces esas variables dejan de
ser `any` y TypeScript infiere el tipo real solo.

Esto se verificó de forma concreta en el entorno de desarrollo (que no tiene
salida de red hacia `binaries.prisma.sh`, así que no pudo generar el cliente
real): se inspeccionó directamente
`node_modules/.prisma/client/default.d.ts` y se confirmó que es el stub
genérico sin ningún modelo del schema — de ahí sale el error, no de la
lógica del código. Se revisaron a mano los ~35 sitios que hacen `.map()`
sobre resultados de Prisma y **ninguno tiene un error lógico independiente
de esto** (accesos a propiedades correctos, variables correctas, null-checks
donde corresponde). **Deliberadamente no se agregaron anotaciones de tipo,
casts, ni `any` para silenciar esto** — habría sido blindar artificialmente
un build teórico en vez de dejar que Prisma tipe el código de verdad.

**Lo que Adrián debe hacer con esto:**
1. Corre la secuencia de arriba, completa, en ese orden.
2. Si `npm run build` termina limpio — perfecto, no hay nada más que hacer
   aquí.
3. **Si sobreviven errores de TypeScript después de que `prisma generate`
   corrió con éxito** — esos sí son errores reales que hay que corregir
   (probablemente pocos, o ninguno). Repórtalos tal cual salen; con ese log
   se corrigen puntualmente, sin adivinar.

Además confirma en el log que:

- `prisma validate` no reporta errores de schema
- No hay advertencias de TypeScript bloqueantes fuera de lo descrito arriba

Si el build falla por otra razón (variable de entorno faltante, migración no
aplicada), Vercel te da el log completo — ese tipo de error es más directo
de ubicar.

## 7. Desplegar

Si conectaste un repositorio, cada push a la rama configurada dispara el
deploy automáticamente. Si subiste el proyecto directo, usa el botón
**Deploy** en el dashboard de Vercel.

## 8. Checklist de prueba manual en staging

Una vez desplegado, entra a la URL de staging y verifica, en este orden:

1. **Login** — con `admin@boxxera.com` / `boxxera2026`
2. **Roster público** (`/roster`) — se ven los boxeadores de ejemplo
3. **Perfil de boxeador** (`/fighters/[slug]`) — abre cualquiera desde el
   roster
4. **Dashboard** — el BOXXERA Command Center carga con acciones prioritarias
5. **Fight Opportunities** (`/dashboard/opportunities`) — se ve la
   oportunidad de ejemplo con sus 4 scores
6. **Events** (`/dashboard/events`) — el evento de ejemplo muestra P&L y
   break-even
7. **Votación** — desde la landing pública, vota por una oportunidad y
   confirma que el contador sube
8. **Roles** — cierra sesión y entra con `comision@boxjuarez.mx`,
   `aztecas@boxxera.com`, `promotor@boxxera.com`, `sponsor@boxxera.com`, y
   `boxeador@boxxera.com` (todas `/boxxera2026`) — cada uno debe ver solo lo
   que le corresponde a su rol

## 9. Conectar `staging.boxxera.com` (opcional, después de validar)

En Vercel → **Settings → Domains**, agrega `staging.boxxera.com` y sigue las
instrucciones de DNS que Vercel te da (generalmente un registro CNAME).

## 10. Conectar `boxxera.com` (solo después de aprobación)

**No hagas este paso hasta que alguien del equipo apruebe explícitamente lo
visto en staging.** Cuando llegue el momento: mismo proceso que el paso 9,
pero con el dominio principal, y actualiza `NEXTAUTH_URL` a
`https://boxxera.com`.

---

## Problemas conocidos / limitaciones

- **Las migraciones de Prisma (`prisma/migrations/`) ya están incluidas y
  fueron validadas contra PostgreSQL 16 real** — ver sección 4 arriba para
  el detalle exacto de qué se probó.
- **`npm ci` sí corre limpio en este entorno** (confirmado). `npx prisma
  generate`, `npx prisma validate` y por lo tanto `npm run build` **no se
  pudieron correr con éxito de punta a punta** aquí — mismo bloqueo de red
  hacia `binaries.prisma.sh`. **La secuencia de build completa (`npm ci` →
  `prisma generate` → `prisma validate` → `npm run build`) es la primera
  vez que corre a través del CLI real en un entorno con internet completo —
  eso lo hace Adrián.** Ver la sección 6 arriba para el detalle exacto de
  qué esperar (el error de TypeScript tipo "implicitly has an any type" en
  archivos que hacen `.map()` sobre resultados de Prisma) y por qué,
  siguiendo esa secuencia, no debería sobrevivir.
- Se corrigió un bug real de build que sí se pudo reproducir y solucionar
  aquí: `next/font/google` intenta descargar la tipografía en build-time, lo
  cual puede fallar según el entorno; se cambió a un `<link>` de Google
  Fonts (mismo resultado visual, sin esa dependencia de red en build-time).
- La membresía y los patrocinios no tienen cobro automático — es
  administración manual desde el dashboard hasta que se integre un proveedor
  de pagos (ver README).
- El formulario público "Únete a BOXXERA" guarda los datos del interesado en
  el campo `notes` de un `Task` genérico (sin modelo propio) — deuda técnica
  documentada, ver README.

