# CLAUDE.md — Apuesta Futbolera FGA 🏆

> Guía maestra para Claude Code. Lee este archivo completo antes de escribir cualquier línea de código.
> Sigue las instrucciones en orden. Nunca asumas; si hay ambigüedad, pregunta.

---

## 📋 Visión del Proyecto

Plataforma web **multi-torneo y multi-grupo** para organizar pollas de predicciones deportivas entre grupos de personas (colegas, familia, amigos).

Un **Superadmin** crea campeonatos (Mundial 2026, Champions League, Liga 1…) y carga sus partidos. Los usuarios crean o se unen a **Pollas** (grupos independientes como "La Oficina" o "La Familia"), cada una con su propia configuración, cuota, ranking y panel público compartible.

```
Superadmin
  └── Campeonato (Tournament)          ← Mundial 2026, Champions 2025-26...
        ├── Partidos (Match)            ← fixture completo del torneo
        └── Pollas (Pool)              ← La Oficina, La Familia...
              ├── Configuración propia  ← cuota, scoring, visibilidad, ventana de fechas
              ├── Participantes         ← PoolMember con hasPaid, rol
              ├── Predicciones          ← una por participante por partido
              │     └── Ingreso admin   ← OWNER/MODERATOR puede ingresar en nombre de otros
              ├── Ranking propio        ← independiente entre pollas del mismo torneo
              └── Panel público         ← URL compartible sin login
```

**Principios de diseño:**
- Estéticamente espectacular: animaciones, gradientes, glassmorphism, partículas
- Configurabilidad total: campeonatos, pollas y reglas sin tocar código
- Multi-tenant: múltiples pollas aisladas sobre el mismo torneo
- Panel público por polla: ranking y resultados sin login
- Producción desde el día uno: Docker, HTTPS, backups, logs
- Seguridad no negociable: autenticación sólida, roles, rate limiting, validación

---

## 🏗️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript (strict mode, sin `any`)
- **Estilos:** Tailwind CSS + CSS custom properties para theming
- **Animaciones:** Framer Motion + CSS animations nativas
- **Efectos visuales:** tsparticles (fondo animado), react-confetti (celebraciones)
- **Iconos:** Lucide React
- **Componentes UI:** shadcn/ui como base, siempre personalizados
- **Formularios:** React Hook Form + Zod
- **Estado global:** Zustand (solo si es necesario; preferir React Query)
- **Data fetching:** TanStack Query (React Query v5)
- **Gráficos:** Recharts

### Backend / API
- **Runtime:** Next.js API Routes (Route Handlers en App Router)
- **ORM:** Prisma
- **Base de datos:** PostgreSQL 16
- **Autenticación:** NextAuth.js v5 (Auth.js) con providers: Credentials + Google OAuth
- **Sesiones:** JWT + httpOnly cookies
- **Validación:** Zod (compartido entre frontend y backend)
- **Email:** Nodemailer (SMTP configurable)
- **Rate limiting:** implementación custom con Redis (dual-bucket: por IP + por cuenta)
- **Cache:** Redis (ranking en tiempo real)

### Infraestructura
- **Contenedores:** Docker + Docker Compose
- **Servidor web:** Nginx (reverse proxy, SSL termination)
- **SSL:** Let's Encrypt (Certbot) o certificado propio
- **CI/CD:** GitHub Actions (lint → test → build → deploy)
- **Logs:** Pino logger estructurado
- **Backups:** Script pg_dump automatizado en cron

---

## 📁 Estructura de Directorios

```
pollaapp/
├── CLAUDE.md
├── .env.example
├── .env.local                         # Solo local, en .gitignore
├── .gitignore
├── docker-compose.yml                 # Producción
├── docker-compose.dev.yml             # Desarrollo local
├── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── scripts/
│   ├── backup-db.sh
│   ├── restore-db.sh
│   └── seed-tournaments.ts            # Seed de torneos y fixtures
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing: lista torneos activos
│   │   │
│   │   ├── (auth)/                    # Rutas públicas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/              # Soporta ?invite=[code]
│   │   │   ├── forgot-password/
│   │   │   ├── verify-email/
│   │   │   ├── setup/                 # Bootstrap: primer superadmin
│   │   │   └── join/[inviteCode]/     # Unirse a polla por link (sin login requerido)
│   │   │
│   │   ├── (app)/                     # Rutas privadas (requieren login)
│   │   │   ├── dashboard/             # Mis pollas activas
│   │   │   ├── tournaments/
│   │   │   │   └── [tournamentId]/
│   │   │   │       ├── page.tsx       # Detalle torneo: pollas disponibles
│   │   │   │       └── pools/
│   │   │   │           ├── new/       # Crear nueva polla en este torneo
│   │   │   │           └── [poolId]/
│   │   │   │               ├── page.tsx          # Dashboard de la polla
│   │   │   │               ├── predictions/      # Hacer/editar apuestas
│   │   │   │               ├── ranking/          # Ranking de la polla
│   │   │   │               ├── my-predictions/   # Mis apuestas + historial
│   │   │   │               └── settings/
│   │   │   │                   ├── page.tsx       # Config general (OWNER)
│   │   │   │                   ├── scoring/       # Puntuación + ventana de fechas (OWNER)
│   │   │   │                   ├── fee/           # Cuota (OWNER)
│   │   │   │                   ├── visibility/    # Visibilidad (OWNER)
│   │   │   │                   ├── members/       # Miembros (OWNER + MODERATOR)
│   │   │   │                   ├── predictions/   # Ver todas las apuestas (OWNER + MODERATOR)
│   │   │   │                   ├── enter-predictions/ # Ingresar apuestas por admin (OWNER + MODERATOR)
│   │   │   │                   └── danger/        # Zona de peligro (OWNER)
│   │   │   ├── profile/
│   │   │   └── notifications/
│   │   │
│   │   ├── p/                         # Panel PÚBLICO (sin login)
│   │   │   └── [poolSlug]/
│   │   │       ├── page.tsx           # Ranking público + fixture + resultados
│   │   │       └── players/
│   │   │           └── [userId]/      # Perfil público de un participante
│   │   │
│   │   ├── superadmin/                # Solo rol SUPERADMIN
│   │   │   ├── tournaments/           # CRUD de campeonatos
│   │   │   │   ├── new/
│   │   │   │   └── [tournamentId]/
│   │   │   │       ├── matches/       # CRUD partidos + ingreso de resultados + filtro por fecha
│   │   │   │       └── managers/      # Asignar Tournament Managers
│   │   │   └── users/                 # Gestión global de usuarios
│   │   │       ├── new/
│   │   │       ├── import/            # Importar usuarios desde CSV
│   │   │       └── [userId]/          # Perfil + seguridad + actividad
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── auth/register/
│   │       ├── auth/forgot-password/
│   │       ├── auth/reset-password/
│   │       ├── auth/resend-verification/
│   │       ├── setup/
│   │       ├── health/
│   │       ├── tournaments/[id]/pools/
│   │       ├── pools/[poolId]/
│   │       │   ├── route.ts           # DELETE pool
│   │       │   ├── general/           # PATCH nombre, descripción, logo
│   │       │   ├── scoring/           # PATCH puntuación + ventana de fechas
│   │       │   ├── fee/               # PATCH cuota
│   │       │   ├── visibility/        # PATCH visibilidad
│   │       │   ├── join/              # POST unirse
│   │       │   ├── transfer-owner/    # POST transferir ownership
│   │       │   ├── regenerate-invite/ # POST nuevo código
│   │       │   ├── recalculate-ranking/ # POST recálculo manual del ranking
│   │       │   ├── members/           # GET/POST miembros
│   │       │   │   ├── [memberId]/    # PATCH/DELETE miembro individual
│   │       │   │   │   └── message/   # POST notificación a un miembro
│   │       │   │   ├── bulk-confirm-payment/ # POST confirmar pagos masivo
│   │       │   │   └── export/        # GET exportar CSV
│   │       │   └── predictions/
│   │       │       ├── route.ts       # POST predicción propia
│   │       │       ├── admin/         # POST ingreso admin por partido
│   │       │       └── admin-member/  # POST ingreso admin por participante
│   │       ├── notifications/
│   │       ├── profile/
│   │       ├── superadmin/
│   │       └── cron/deadline-warnings/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/                    # Header, Sidebar, Footer
│   │   ├── auth/
│   │   ├── tournaments/
│   │   ├── pools/
│   │   ├── matches/
│   │   ├── predictions/
│   │   ├── ranking/
│   │   ├── public/
│   │   ├── effects/                   # ParticleBackground, ConfettiCelebration
│   │   └── superadmin/
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── redis.ts
│   │   ├── scoring.ts                 # Motor de puntuación (puro, testeable)
│   │   ├── scoring-batch.ts           # Batch scoring al ingresar resultado
│   │   ├── deadline.ts                # isPredictionOpen()
│   │   ├── deadline-warnings.ts       # Cron de avisos de cierre
│   │   ├── slug.ts
│   │   ├── email.ts
│   │   ├── notifications.ts
│   │   ├── require-pool-role.ts       # Auth helper para rutas de polla
│   │   ├── date-peru.ts               # getLimaDateKey, toDatetimeLocalPeru, etc.
│   │   ├── validations/
│   │   └── utils.ts
│   ├── hooks/
│   │   └── use-settings-submit.ts     # Hook para PATCH de configuración de polla
│   ├── stores/
│   ├── types/
│   └── proxy.ts                       # Middleware (renombrado de middleware.ts)
└── tests/
    ├── unit/
    └── integration/
```

---

## 🗄️ Modelo de Base de Datos (Prisma Schema — estado actual)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USUARIOS ────────────────────────────────────────────────────────────────

model User {
  id              String      @id @default(cuid())
  email           String      @unique
  name            String
  username        String?     @unique
  password        String?
  passwordChangedAt DateTime?
  avatarUrl       String?
  phone           String?
  bio             String?
  role            GlobalRole  @default(USER)
  isVerified      Boolean     @default(false)
  isActive        Boolean     @default(true)
  verifyToken     String?
  verifyTokenExp  DateTime?
  resetToken      String?
  resetTokenExp   DateTime?
  pendingEmail    String?
  deleteToken     String?
  deleteTokenExp  DateTime?
  internalNote    String?     @db.Text
  notifPrefs      Json        @default("{...}")
  lastLoginAt     DateTime?
  lastLoginIp     String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdById     String?

  poolMemberships    PoolMember[]
  predictions        Prediction[]
  ownedPools         Pool[]              @relation("PoolOwner")
  notifications      Notification[]
  activityLogs       UserActivityLog[]
  managedTournaments TournamentManager[]
  accounts           Account[]
  sessions           Session[]
  createdByUser      User?               @relation("CreatedBy", fields: [createdById], references: [id])
  createdUsers       User[]              @relation("CreatedBy")
}

model Account { ... }   // NextAuth OAuth accounts
model Session { ... }   // NextAuth sessions

model TournamentManager {
  id               String  @id @default(cuid())
  userId           String
  tournamentId     String
  assignedById     String
  assignedAt       DateTime @default(now())
  canEditMatches   Boolean  @default(true)
  canEnterResults  Boolean  @default(true)
  canCreateMatches Boolean  @default(false)
  ...
  @@unique([userId, tournamentId])
}

model UserActivityLog { ... }   // Auditoría de acciones

model Tournament {
  id          String    @id @default(cuid())
  name        String
  shortName   String
  logo        String?
  sport       String    @default("football")
  country     String?
  season      String
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean   @default(true)
  isPublic    Boolean   @default(true)
  description String?   @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  ...
}

model Match {
  id           String      @id @default(cuid())
  tournamentId String
  matchNumber  Int
  phase        String
  round        Int?
  homeTeam     String
  awayTeam     String
  homeFlag     String
  awayFlag     String
  matchDate    DateTime
  venue        String?
  city         String?
  homeScore    Int?
  awayScore    Int?
  status       MatchStatus @default(UPCOMING)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  @@unique([tournamentId, matchNumber])
}

model Pool {
  id           String  @id @default(cuid())
  tournamentId String
  ownerId      String
  name         String
  slug         String  @unique
  description  String?
  logo         String?
  isPublic     Boolean @default(false)
  inviteCode   String  @unique
  inviteOnly   Boolean @default(true)
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  ...
}

model PoolConfig {
  id     String @id @default(cuid())
  poolId String @unique
  // Plazos
  predictionDeadlineHours Int @default(1)
  // Puntuación
  pointsExactScore      Int   @default(5)
  pointsCorrectResult   Int   @default(2)
  pointsCorrectGoalDiff Int   @default(3)
  bonusKnockout         Float @default(1.5)
  bonusFinal            Float @default(2.0)
  tiebreakerCriteria    String @default("exactScores,goalDiff,alphabetical")
  // Ventana de puntuación (partidos fuera de este rango no suman al ranking)
  scoringStartDate      DateTime?   // desde (inclusive) — null = desde el inicio
  scoringEndDate        DateTime?   // hasta (inclusive) — null = hasta el final
  // Cuota
  entryFeeEnabled       Boolean @default(false)
  entryFeeAmount        Float   @default(0)
  entryFeeCurrency      String  @default("PEN")
  entryFeeInstructions  String? @db.Text
  prizeDescription      String? @db.Text
  // Visibilidad pública
  publicPanelEnabled    Boolean @default(true)
  publicShowRanking     Boolean @default(true)
  publicShowPredictions Boolean @default(false)
  publicShowFixture     Boolean @default(true)
  // Visibilidad entre miembros
  showOthersPredictions PredictionRevealMode @default(AFTER_MATCH)
  // Participantes
  maxMembers            Int     @default(50)
  registrationOpen      Boolean @default(true)
  // Contenido
  welcomeMessage        String? @db.Text
  rules                 String? @db.Text
  accentColor           String  @default("#F59E0B")
  updatedAt             DateTime @updatedAt
}

model PoolMember {
  id           String   @id @default(cuid())
  poolId       String
  userId       String
  role         PoolRole @default(PLAYER)
  hasPaid      Boolean  @default(false)
  paymentNote  String?
  invitedBy    String?
  // Cache de estadísticas
  totalPoints          Int  @default(0)
  exactScores          Int  @default(0)
  rankPosition         Int?
  previousRankPosition Int?   // snapshot pre-recálculo, para flecha de tendencia
  isActive     Boolean  @default(true)
  joinedAt     DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@unique([poolId, userId])
  @@index([poolId, totalPoints])
}

model Prediction {
  id           String     @id @default(cuid())
  poolId       String
  userId       String
  matchId      String
  homeScore    Int
  awayScore    Int
  pointsEarned Int        @default(0)
  resultType   ResultType @default(NONE)
  isScored     Boolean    @default(false)
  submittedAt  DateTime   @default(now())
  editedAt     DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  @@unique([poolId, userId, matchId])
}

model Notification { ... }

// Bootstrap — existe exactamente un registro con id="singleton"
model AppSetup {
  id          String   @id @default("singleton")
  appName     String   @default("Apuesta Futbolera FGA")
  completedAt DateTime
  setupById   String
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────
enum GlobalRole   { USER | TOURNAMENT_MANAGER | SUPERADMIN }
enum PoolRole     { PLAYER | MODERATOR | OWNER }
enum MatchStatus  { UPCOMING | LIVE | FINISHED | CANCELLED }
enum ResultType   { NONE | CORRECT_RESULT | CORRECT_DIFF | EXACT_SCORE }
enum PredictionRevealMode { NEVER | AFTER_MATCH | AFTER_SCORED | ALWAYS }
enum NotificationType { RESULT_SCORED | RANK_UP | RANK_DOWN | DEADLINE_WARNING |
                        PAYMENT_CONFIRMED | WELCOME | POOL_INVITE | ACCOUNT_CREATED |
                        ROLE_CHANGED | CUSTOM }
enum ActivityAction { LOGIN | LOGOUT | REGISTER | ... (ver schema.prisma completo) }
```

---

## 🔐 Roles y Permisos

### Mapa de acceso por GlobalRole

```
┌─────────────────────┬────────────────┬──────────────────────┬─────────────┐
│ Acción              │ SUPERADMIN     │ TOURNAMENT_MANAGER   │ USER        │
├─────────────────────┼────────────────┼──────────────────────┼─────────────┤
│ Ver landing         │ ✅             │ ✅                   │ ✅          │
│ Ver panel público   │ ✅             │ ✅                   │ ✅          │
│ Registrarse         │ ✅             │ ✅                   │ ✅          │
│ Crear pollas        │ ✅             │ ✅                   │ ✅          │
│ Apostar             │ ✅             │ ✅                   │ ✅          │
│ CRUD torneos        │ ✅ todos       │ ✅ asignados         │ ❌          │
│ Ingresar resultados │ ✅ todos       │ ✅ asignados         │ ❌          │
│ Gestionar usuarios  │ ✅             │ ❌                   │ ❌          │
│ Acceder /superadmin │ ✅             │ ❌                   │ ❌          │
└─────────────────────┴────────────────┴──────────────────────┴─────────────┘
```

### Mapa de acceso por PoolRole

```
┌────────────────────────────────────┬─────────┬────────────┬─────────┐
│ Acción                             │ OWNER   │ MODERATOR  │ PLAYER  │
├────────────────────────────────────┼─────────┼────────────┼─────────┤
│ Apostar y ver sus predicciones     │ ✅      │ ✅         │ ✅      │
│ Ver ranking de la polla            │ ✅      │ ✅         │ ✅      │
│ Ver todas las apuestas (admin)     │ ✅      │ ✅         │ ❌      │
│ Ingresar apuestas por admin        │ ✅      │ ✅         │ ❌      │
│ Confirmar pagos de miembros        │ ✅      │ ✅         │ ❌      │
│ Invitar / expulsar miembros        │ ✅      │ ✅         │ ❌      │
│ Cambiar PoolRole de miembros       │ ✅      │ ❌         │ ❌      │
│ Editar PoolConfig                  │ ✅      │ ❌         │ ❌      │
│ Recalcular ranking manualmente     │ ✅      │ ❌         │ ❌      │
│ Transferir ownership               │ ✅      │ ❌         │ ❌      │
│ Eliminar la polla                  │ ✅      │ ❌         │ ❌      │
└────────────────────────────────────┴─────────┴────────────┴─────────┘
```

---

## 🏆 Lógica de Puntuación

Implementada en `src/lib/scoring.ts` (funciones puras) y `src/lib/scoring-batch.ts` (efectos en DB).

**Reglas por defecto (configurables por PoolConfig):**
- Marcador exacto (2-1 → 2-1): **5 pts**
- Diferencia de goles correcta (2-0 → 3-1): **3 pts**
- Solo el resultado (ganador/empate): **2 pts**
- Nada: **0 pts**
- Multiplicador eliminatorias: **×1.5**
- Multiplicador final: **×2.0**

### Ventana de Puntuación

`PoolConfig.scoringStartDate` y `PoolConfig.scoringEndDate` definen un rango de fechas. Las predicciones de partidos **fuera** de esa ventana no suman al ranking de la polla (pero sus puntos individuales se calculan y guardan igual). Útil para:
- Pollas de semana específica (ej. "SGIN Semana 18-21 Jun")
- Pollas que arrancan a mitad del torneo

Después de cambiar la ventana se requiere recalcular el ranking manualmente desde Configuración → Puntuación.

### Ingreso Admin de Predicciones

OWNER y MODERATOR pueden ingresar predicciones en nombre de otros participantes desde **Configuración → Ingresar**:
- **Por partido:** un card por partido, todos los miembros como filas
- **Por participante:** un card por miembro, todos los partidos como filas

Si el partido ya tiene resultado oficial al momento de guardar, los puntos se calculan y almacenan de inmediato. Después de ingresar todas las predicciones, se pulsa **Recalcular ranking**.

API endpoints:
- `POST /api/pools/[poolId]/predictions/admin` — por partido (matchId + N entries)
- `POST /api/pools/[poolId]/predictions/admin-member` — por miembro (userId + N entries)

---

## 🔐 Seguridad

- Contraseñas: **bcryptjs** (12 rounds en producción)
- JWT firmado con `NEXTAUTH_SECRET` (mínimo 32 chars)
- Email verification obligatorio para cuentas locales
- Recuperación de contraseña con token firmado (expira en 1h)
- **Rate limiting dual-bucket:** login IP (30/15min) + login cuenta (5/15min). Crítico en entornos Docker/NAT donde todos los usuarios comparten la misma IP pública (172.x.x.x).
- Middleware (`proxy.ts`) protege `/dashboard`, `/tournaments`, `/profile`, `/notifications`, `/superadmin`
- Rutas públicas: `/`, `/login`, `/register`, `/p/*`, `/join/*`, `/forgot-password`, `/verify-email`, `/setup`, `/api/auth`, `/api/setup`
- Todo input validado con Zod antes de tocar la DB
- Panel `/superadmin/*` solo accesible con `GlobalRole.SUPERADMIN`
- `hasPaid` solo se exige cuando `entryFeeEnabled = true`

---

## 🌐 Panel Público (`/p/[poolSlug]`)

Server Component con `revalidate = 60`. Accesible sin login. Contenido controlado por toggles en PoolConfig:
- `publicPanelEnabled` — activa/desactiva la ruta
- `publicShowRanking` — tabla de posiciones
- `publicShowPredictions` — apuestas de todos (solo partidos terminados)
- `publicShowFixture` — próximos partidos

OG metadata dinámica para compartir en redes. El botón "Unirme" redirige a `/join/[inviteCode]` (sin login requerido) o al registro.

---

## 🐳 Docker y Despliegue

### Servicios (docker-compose.yml producción)
- `app` — Next.js (node:20-alpine), puerto interno 3000
- `db` — postgres:16-alpine, volumen persistente
- `nginx` — nginx:alpine, puertos 80 y 443
- `redis` — redis:7-alpine
- `backup` — alpine con pg_dump en cron diario

### Variables de Entorno (.env.example)
```bash
DATABASE_URL="postgresql://user:password@db:5432/pollaapp"
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET=""           # openssl rand -base64 32
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Apuesta Futbolera FGA <noreply@tu-dominio.com>"
REDIS_URL="redis://redis:6379"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
NODE_ENV="production"
```

---

## 📋 Estado de Desarrollo

```
✅  1. Setup base: create-next-app, TypeScript, Tailwind, App Router
✅  2. Docker Compose dev: PostgreSQL + Redis
✅  3. Prisma: schema completo + migraciones + seed Mundial 2026
✅  4. Bootstrap /setup: primer SUPERADMIN sin tocar la DB
✅  5. NextAuth: Credentials + Google, email verification, invalidación de sesiones
✅  6. Middleware (proxy.ts): protección de rutas por GlobalRole y PoolRole
✅  7. Sistema de diseño: tokens CSS, fuentes, GlassCard, ParticleBackground
✅  8. Layout global: Header con campanita y menú, Sidebar responsive
✅  9. Auth UI: login / register / forgot-password / verify-email
✅ 10. Perfil propio (/profile/): editar info, avatar, contraseña, email, sesiones, notif, actividad, eliminar cuenta
✅ 11. Torneos — Superadmin: CRUD en /superadmin/tournaments/
✅ 12. Partidos: CRUD + seed fixture + ingreso de resultados + filtros (fase, estado, fecha)
✅ 13. Gestión de usuarios — Superadmin: lista, crear, editar, suspender, reset password, impersonar, import CSV
✅ 14. Tournament Managers: asignar/revocar desde /superadmin/tournaments/[id]/managers
✅ 15. Pollas: crear, unirse por inviteCode, PoolConfig por defecto
✅ 16. Gestión de miembros: roles, cuota, expulsión, notificaciones, export CSV
✅ 17. Predicciones: CRUD + deadline + edición + cierre automático
✅ 18. Scoring engine: funciones puras en scoring.ts
✅ 19. Ingreso de resultados: superadmin/manager + scoring batch + recálculo ranking
✅ 20. Panel público /p/[slug]: Server Component + metadata OG + toggles
✅ 21. Notificaciones: modelo + creación automática + UI campanita + preferencias
✅ 22. Ranking: tiebreaker configurable + animaciones + podio
✅ 23. Mis apuestas: historial con filtros y resumen estadístico
✅ 24. Configuración de polla: tabs General / Puntuación / Cuota / Visibilidad / Miembros / Predicciones / Ingresar / Peligro
✅ 25. Perfiles públicos: /p/[slug]/players/[userId]
⚠️ 26. Email flows: verificación + recuperación ✅ | notificaciones de resultado por email ⏳
✅ 27. Docker producción: Dockerfile multi-stage + compose + Nginx + SSL
⏳ 28. Scripts: backup ✅ | deploy script ⏳
⏳ 29. Hardening: headers seguridad ✅ | health check ✅ | audit trail ✅ | logs estructurados ⏳
⏳ 30. Cron de sincronización de resultados: propuesta lista, pendiente implementar
```

---

## 🎨 Sistema de Diseño

### Paleta de Colores
```css
:root {
  --bg-primary:   #0a0a1a;
  --bg-secondary: #111128;
  --bg-glass:     rgba(255,255,255,0.05);
  --gold-start:   #F59E0B;
  --gold-end:     #EF4444;
  --gradient-main: linear-gradient(135deg, #F59E0B, #EF4444);
  --text-primary: #F8FAFC;
  --text-muted:   #94A3B8;
  --border-glass: rgba(255,255,255,0.1);
  --success: #10B981;
  --warning: #F59E0B;
  --error:   #EF4444;
  --info:    #3B82F6;
}
```

### Tipografía
- **Display:** `Bebas Neue` — títulos y nombres de torneos
- **UI / Cuerpo:** `Inter`
- **Datos:** `JetBrains Mono` — marcadores y puntos

---

## ⚠️ Reglas Absolutas

1. **TypeScript estricto:** `"strict": true`. Zero `any`. Zero `@ts-ignore`.
2. **Sin secretos en código:** todo via variables de entorno.
3. **Server-side por defecto:** lógica de negocio y DB en Server Components o Route Handlers.
4. **Prisma singleton:** un solo cliente en `src/lib/db.ts`.
5. **Zod en todo:** validar input antes de tocar la DB.
6. **Aislamiento entre pollas:** nunca mezclar datos de una Pool con otra en queries.
7. **Scoring determinista:** `calculatePoints()` siempre da el mismo resultado para los mismos inputs.
8. **Panel público sin auth:** `/p/*` y `/join/*` no pueden importar nada que requiera sesión.
9. **`hasPaid` condicional:** solo exigir pago cuando `pool.config.entryFeeEnabled === true`.
10. **Rate limiting dual-bucket:** login por IP (loose) + por IP+email (strict). No usar solo IP en entornos NAT/Docker.
11. **Responsive primero:** mobile (320px) antes que desktop.
12. **Error boundaries y loading states** en cada sección async.

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Base de datos
npx prisma migrate dev --name init
npx prisma studio
npx prisma db seed

# Docker desarrollo
docker compose -f docker-compose.dev.yml up -d

# Docker producción
docker compose --env-file .env.production build --no-cache app
docker compose --env-file .env.production up -d
docker compose --env-file .env.production exec app npx prisma migrate deploy
docker compose --env-file .env.production logs -f app

# Tests
npm run test
npm run test:coverage

# Backup manual
./scripts/backup-db.sh
```

---

*Última actualización: Junio 2026 | Apuesta Futbolera FGA — Multi-torneo, multi-grupo 🏆*
