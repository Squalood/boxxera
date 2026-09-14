# BOXXERA — Estado actual y análisis de lo que falta

Documento de referencia único: qué es, qué se decidió, qué ya está
construido, y qué sigue pendiente. Úsalo para poner al día a cualquiera
(equipo, inversionista, otra sesión de IA) sin repetir toda la conversación.

---

## 1. Qué es

**BOXXERA es la infraestructura digital del boxeo profesional en la
frontera** (Cd. Juárez–El Paso, con visión de expansión al norte de México y
eventualmente EE.UU.). No es promotor, no es manager, no es liga, no es
casa de apuestas.

**Analogía que define el modelo:** BOXXERA es a Lymbika lo que un hospital
virtual es a un hospital real. Lymbika no es dueña de camas ni quirófanos,
pero por su medio sí se opera de verdad. BOXXERA no es dueña de la arena,
pero por su medio sí se pelea de verdad — rentando venue, médicos,
producción, seguridad, todo lo necesario para que el evento exista.

**Nombre:** pasó por "Esquina" → "Guantes Rojos" → **"BOXXERA"** (nombre
final). Posicionamiento: *"El padrón oficial del boxeo profesional en la
frontera"* / hook actual del hero: *"¿Quién pelea la próxima vez? Tú
decides."*

---

## 2. Respaldo institucional

- Aliado: **H. Comisión de Boxeo Profesional de Ciudad Juárez**, presidida
  por el **Dr. Lorenzo Soberanes Maya** (nombrado por el ayuntamiento vía
  IMDEJ, ex jefe médico del CMB/WBC). Ya llevó a cabo una credencialización
  manual de boxeadores con QR — BOXXERA digitaliza exactamente eso.
- Respaldo personal, además del institucional: **Dr. Gabriel Omar Parra
  Pizarro** (fundador, también fundador de [[lymbika-platform]]) y el propio
  Dr. Soberanes.
- **El acuerdo con la comisión ya está firmado y por escrito.**
- **Posicionamiento público deliberado: "aliado", no "respaldado por" ni "en
  colaboración con"** — para que quede claro que la comisión da legitimidad
  institucional, pero **no participa del lado comercial**. Quien cobra
  siempre es BOXXERA (la entidad privada), nunca la comisión — evita mezclar
  función pública con negocio privado.
- **Pendiente sin resolver:** declaración formal de que la participación del
  Dr. Soberanes en BOXXERA (negocio privado) no representa conflicto de
  interés con su cargo público como comisionado. Se mencionó, no se
  formalizó.
- El WBC global **no gobierna** la comisión local — solo la felicitó
  públicamente. Su marca/emblema no se usa sin autorización directa de ellos.
- El motivo por el que **no** se mezcla con la marca del WBC ni se vuelve
  una plataforma "de médicos" (aunque los dos fundadores lo son): el foco
  debe quedarse en el ecosistema del boxeo, la salud es un beneficio más
  entre varios (farmacia, consulta, legal), no el propósito central.

---

## 3. Modelo de negocio

**Corrección vigente (sustituye la anterior): el boxeador SÍ paga una
membresía simbólica de $50 MXN/mes** — no es la fuente principal de
utilidad, representa pertenencia al ecosistema. BOXXERA no se vuelve manager
por esto, no controla la carrera del boxeador ni cobra automáticamente % de
su bolsa.

Capas de monetización decididas:

1. **Patrocinio/sponsorship** — empresarios pagan por visibilidad,
   networking y clientes potenciales ligados a un boxeador o evento.
   BOXXERA se queda con comisión; la mayor parte llega al boxeador o al
   evento.
2. **Economía de eventos** — cuando BOXXERA renta lo necesario (venue,
   médico, producción) para que un evento exista, el ingreso viene del P&L
   del evento mismo (boletaje, patrocinio del evento, streaming a futuro).
3. **Certificación/infraestructura para promotores externos** — un
   promotor que no es BOXXERA puede usar el roster verificado y el motor de
   matchmaking para armar mejores carteleras; no compite con ellos, los
   sirve.
4. **(Pendiente, nunca construido)** — la cuota simbólica de comunidad
   (~$50 MXN/mes, pagada por el público, repartida entre fondo de
   boxeadores / comisión / plataforma) se decidió conceptualmente pero
   **no se construyó** en el producto. Hoy todo el lado público (votar, ver
   boxeadores) es gratis — es la pieza que falta si se quiere cerrar esa
   idea original.

**Modelos descartados explícitamente y por qué:**
- **Manager / revenue-share sobre el boxeador** — descartado por
  regulación (ley de valores, Muhammad Ali Boxing Reform Act y equivalentes
  locales de manager).
- **Membresía tipo ClassPass a gimnasios** — explorado, superado por el
  modelo de patrocinio directo.
- **Ser promotor propio compitiendo por carteleras** — descartado, BOXXERA
  es infraestructura neutral, no compite.

**Pagos:** la idea era enrutar cobros a través de la infraestructura de
Stripe/POS que ya existe en Lymbika (en vez de construir rieles de pago
nuevos), con una cuenta/línea separada para no mezclar contablemente con el
ingreso de Lymbika de cara a sus propios inversionistas. **Esto tampoco se
ha construido todavía** — no hay integración de Stripe en el código.

**Nuevo mecanismo de demanda real (sí construido):** votación pública sobre
oportunidades de pelea ya evaluadas por el motor de matchmaking — el voto
alimenta el `commercialScore`, dando evidencia real de interés antes de
gastar en un evento.

---

## 4. Lo que ya está construido (código real, funcional en el zip)

### V1 — Núcleo administrativo
- Multi-tenant/multi-jurisdicción desde el schema: `Country → Region →
  City → Commission → Gym → Fighter`.
- `Fighter` con récord estructurado (recalculado automáticamente, nunca
  manual), estado de verificación con `VerificationLog`.
- `Gym`, `Commission`, `License`, `Ranking`/`RankingEntry`.
- `Benefit`/`FighterBenefit` (farmacia, consulta a $100, legal).
- RBAC por jurisdicción (`SUPER_ADMIN`, `BOXERA_ADMIN`, `COMMISSION_ADMIN`,
  `GYM_ADMIN`, `FIGHTER`, `PROMOTER`, `SPONSOR`, `COMMUNITY_MEMBER`).
- `AuditLog` genérico en cada mutación sensible.
- Roster público (`/roster`), perfil de boxeador (`/fighters/[slug]`),
  dashboard con vista por rol.

### Fase 2 — Digital Fight & Event Engine
- `FightOpportunity`: relaciona dos boxeadores, valida (misma categoría,
  activos, licencias vigentes, no duplicados recientes) y califica con el
  motor de matchmaking (`lib/engine/matchmaking.ts`) — 4 scores (deportivo,
  comercial, logística, económico) + explicación legible.
- Flujo de estados con aprobación humana obligatoria: Descubierta →
  Sugerida → Contacto → Negociando → Aprobada/Rechazada → Convertida a
  pelea. Conversión copia solo lo estructural, nunca el estado económico.
- `Fight` extendido: bolsas, y tres aprobaciones independientes (comisión,
  médica, contrato) — la API bloquea `CONFIRMED` hasta que las tres estén
  `APPROVED`, no solo la UI.
- `Event` extendido (`capacity`, `expectedAttendance`, `eventOwner`:
  `EXTERNAL_PROMOTER` / `BOXXERA` / `CO_PRODUCED`).
- `EventCost`/`EventRevenue` con nivel de confianza
  (`CONFIRMED`/`ESTIMATED`/`ASSUMED`/`PROPOSED`) — nunca se muestra una
  proyección como si fuera un hecho.
- P&L en vivo y punto de equilibrio, siempre recalculado desde el detalle
  (`lib/engine/eventEconomics.ts`), nunca un total editable a mano.
- Simulador what-if (base/optimista/conservador), función pura, nunca
  escribe a la base de datos.
- `Task`: tareas automáticas al aprobar una oportunidad (comisión, médico,
  contrato, venue, sponsor, producción) — genera trabajo, nunca aprueba
  nada solo.
- Dashboard de promotor, Event Command Center (dinero agregado, peleas por
  estado, riesgos detectados).
- **Votación pública** (`OpportunityVote`): anónima por cookie, un voto por
  oportunidad por visitante, solo sobre oportunidades ya evaluadas
  (`SUGGESTED`/`CONTACTING`/`NEGOTIATING` — nunca sobre ideas en blanco).
  Alimenta el `commercialScore` mediante `lib/engine/votes.ts`.

### Identidad visual (aplicada al código real, no solo mockups)
- Paleta: papel/hueso de fondo, oxblood (vino) como acento principal, latón
  como acento de verificación/sello oficial — decisión explícita de alejarse
  de "fondo negro + acento rojo genérico".
- Tipografía: Oswald condensada para headlines y datos (récord, scores),
  cargada de verdad vía `next/font/google` en `layout.tsx`.
- Landing rediseñada como "arena": hero con hook centrado en la votación,
  vitrina de boxeadores reales, eventos próximos, sección de votación en
  vivo, secciones por audiencia (boxeador/gimnasio/comisión/promotor) al
  final, no al frente.
- `/roster` y `/fighters/[slug]` migrados a la misma identidad; `/dashboard`
  y `/login` **deliberadamente** se quedaron en el tema oscuro original
  (superficie de trabajo distinta al público).

---

## 5. Gap analysis — qué falta

### Negocio / legal
- [ ] Cuota de comunidad simbólica — decidida conceptualmente, no construida
- [ ] Integración de pagos (Stripe vía Lymbika, cuenta/línea separada) — no
      construida
- [ ] Declaración de no conflicto de interés del Dr. Soberanes — no
      formalizada
- [ ] Aviso de privacidad (maneja datos personales y documentos) — no
      redactado

### Producto / técnico (según el propio roadmap de fases)
- [ ] Fase 3: Orchestrator de recomendaciones ("3 matchups tienen margen
      positivo", "faltan $X para el break-even") — no construido
- [ ] Fase 3: Escenarios what-if más allá de lo básico, dashboard unificado
- [ ] Fase 4: Ticketing real, streaming, PPV, marketplace avanzado de
      sponsors, matchmaking asistido por IA — no construido (a propósito,
      está fuera de alcance hasta cerrar bien las fases anteriores)
- [ ] Padrón real de boxeadores — hoy solo hay 5 de ejemplo sembrados; la
      comisión necesita dar de alta su padrón completo

### Lanzamiento
- [ ] Hosting + base de datos en producción (dominio ya está registrado)
- [ ] Migrar datos reales, reemplazar el seed de ejemplo
- [ ] Prueba con la comisión antes de abrir al público
- [ ] Monitoreo de errores + respaldos automáticos de la base de datos
- [ ] Verificación de que el código compila limpio (no se pudo probar en
      este entorno por una restricción de red hacia los binarios de
      Prisma — se hizo auditoría manual cruzada de imports/relaciones en su
      lugar, pero falta la corrida real de `npm install` + `prisma
      generate` + `next build`)

---

## 6. Cómo usar este documento

Si vas a retomar esto en otra conversación o con otra persona, empieza
señalando en qué sección de la Sección 5 quieres enfocarte — el resto del
contexto (secciones 1–4) ya está aquí para no repetirlo.
