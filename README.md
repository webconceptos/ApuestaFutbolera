# Apuesta Futbolera FGA 🏆

Plataforma web multi-torneo para organizar **pollas de predicciones deportivas** entre grupos de personas — colegas, familia, amigos. Cada grupo tiene su propio ranking, configuración, cuota y panel público compartible.

---

## ✨ Características principales

### Para los participantes
- **Predecir marcadores** de cualquier partido del torneo con cierre automático antes del inicio
- **Ranking en tiempo real** con posición, puntos, tendencia (⬆ ⬇) y podio visual
- **Historial de apuestas** con estadísticas: % de aciertos, exactos, por fase
- **Panel público** compartible por link sin necesidad de cuenta
- **Notificaciones** al acertar, subir/bajar de posición y cuando se acerca el cierre

### Para los administradores de polla (Owner / Moderador)
- **Crear y configurar** la polla: nombre, cuota de entrada, reglas, colores de acento
- **Gestión de miembros:** invitar, expulsar, confirmar pagos, cambiar roles
- **Ver todas las predicciones** de todos los participantes (con anti-trampa: se ocultan hasta que cierra el plazo)
- **Ingresar predicciones por admin** — ideal cuando los miembros enviaron sus apuestas en papel o por otro canal, en dos modos:
  - **Por partido:** completa las predicciones de todos los miembros para un partido
  - **Por participante:** completa todos los partidos de un miembro de una vez
- **Ventana de puntuación:** configura un rango de fechas (desde / hasta) para pollas de semana específica o que arrancan a mitad del torneo
- **Recálculo manual del ranking** en cualquier momento

### Para el Superadmin
- **CRUD de torneos** con logo, sport, temporada, descripción
- **Gestión de partidos:** carga manual, con filtros por fase, estado y fecha
- **Ingreso de resultados** que dispara automáticamente el cálculo de puntos en todas las pollas
- **Gestión de usuarios:** crear, editar, suspender, importar CSV, impersonar
- **Tournament Managers:** delegar la administración de torneos específicos

---

## 🏗️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 — App Router, Server Components |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS + glassmorphism custom |
| Animaciones | Framer Motion + tsparticles + react-confetti |
| ORM | Prisma |
| Base de datos | PostgreSQL 16 |
| Autenticación | NextAuth.js v5 — Credentials + Google OAuth |
| Cache / Rate limiting | Redis |
| Email | Nodemailer (SMTP) |
| Validación | Zod (compartido frontend/backend) |
| Gráficos | Recharts |
| Deploy | Docker + Docker Compose + Nginx |

---

## 🚀 Inicio rápido

### Prerrequisitos
- Docker Desktop instalado y corriendo
- Node.js 20+
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/webconceptos/ApuestaFutbolera.git
cd ApuestaFutbolera
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```bash
DATABASE_URL="postgresql://apuestafga:password@localhost:5432/apuestafga"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""              # openssl rand -base64 32
GOOGLE_CLIENT_ID=""             # opcional
GOOGLE_CLIENT_SECRET=""         # opcional
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu@email.com"
SMTP_PASS=""
SMTP_FROM="Apuesta Futbolera FGA <noreply@tu-dominio.com>"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Levantar con Docker (desarrollo)

```bash
docker compose -f docker-compose.dev.yml up -d
npm install
npx prisma migrate dev
npx prisma db seed          # carga el fixture del Mundial 2026
npm run dev
```

Abre [http://localhost:3000/setup](http://localhost:3000/setup) para crear el primer Superadmin.

### 4. Producción con Docker Compose

```bash
cp .env.example .env.production
# edita .env.production con tus valores de producción

docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
docker compose --env-file .env.production exec app npx prisma migrate deploy
```

---

## 📖 Flujo de uso

```
1. Superadmin crea el torneo y carga el fixture de partidos
2. Cualquier usuario registrado crea una Polla (grupo)
3. Owner comparte el link de invitación a sus colegas o familia
4. Participantes se unen y registran sus predicciones antes del cierre
5. Superadmin ingresa resultados → el sistema calcula puntos y actualiza el ranking
6. Todos ven el ranking en tiempo real, o en el panel público sin login
```

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/         # Login, registro, recuperación, setup inicial, join
│   ├── (app)/          # Rutas privadas: dashboard, torneos, pollas, perfil
│   ├── p/[poolSlug]/   # Panel público sin login
│   └── superadmin/     # Administración (solo SUPERADMIN)
├── components/
│   ├── ui/             # GlassCard, botones, inputs, skeletons
│   ├── effects/        # ParticleBackground, ConfettiCelebration
│   └── ...             # Por dominio: pools, ranking, predictions...
└── lib/
    ├── scoring.ts           # Motor de puntuación (funciones puras)
    ├── scoring-batch.ts     # Cálculo en lote al ingresar resultado
    ├── date-peru.ts         # Helpers de zona horaria (Lima/UTC)
    └── require-pool-role.ts # Autorización de rutas de polla
```

---

## 🔐 Sistema de roles

### Roles globales

| Rol | Descripción |
|---|---|
| `USER` | Usuario estándar — puede crear y participar en pollas |
| `TOURNAMENT_MANAGER` | Administra torneos asignados (sin acceso a usuarios ni pollas ajenas) |
| `SUPERADMIN` | Acceso total al sistema |

> El primer usuario registrado se convierte automáticamente en SUPERADMIN.

### Roles dentro de una polla

| Rol | Descripción |
|---|---|
| `PLAYER` | Participa y apuesta |
| `MODERATOR` | Co-admin: confirma pagos, gestiona miembros, ingresa apuestas en nombre de otros |
| `OWNER` | Control total: config, puntuación, cuota, visibilidad, recalcular ranking |

---

## 🎯 Lógica de puntuación

Configurable por polla. Valores por defecto:

| Acierto | Puntos |
|---|---|
| Marcador exacto (ej. 2-1 → 2-1) | 5 pts |
| Diferencia de goles correcta (ej. 2-0 → 3-1) | 3 pts |
| Solo el resultado (ganador o empate) | 2 pts |
| Ningún acierto | 0 pts |
| Fase eliminatoria | × 1.5 |
| Final | × 2.0 |

Los criterios de desempate también son configurables (marcadores exactos, diferencia de goles, goles totales, fecha de ingreso, orden alfabético).

### Ventana de puntuación

Opcionalmente se puede definir un rango de fechas (**desde** / **hasta**) para que solo cuenten los partidos dentro de ese período. Ideal para:
- Pollas de semana específica (ej. "La Oficina — Semana 18-21 Jun")
- Pollas que arrancaron cuando el torneo ya había comenzado

---

## 🌐 Panel público

Cada polla puede activar un panel público en `/p/[slug]` — sin login, compartible por WhatsApp o redes sociales — que muestra:
- Ranking de participantes con posición y tendencia
- Últimos resultados con opción de ver las apuestas de todos
- Próximos partidos con countdown al cierre de apuestas

---

## 🐳 Arquitectura Docker (producción)

```
Internet → Nginx (443/80) → Next.js App (:3000)
                                  ↓
                         PostgreSQL 16  +  Redis 7
                                  ↓
                         Backup cron (pg_dump diario → ./backups/)
```

Todos los servicios están en una red interna privada. Solo Nginx expone puertos al exterior.

---

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-feature`
3. Commitea: `git commit -m 'feat: descripción clara'`
4. Push: `git push origin feature/mi-feature`
5. Abre un Pull Request

Por favor sigue TypeScript estricto (cero `any`), valida toda entrada con Zod en el servidor, e incluye tests unitarios para lógica de negocio.

---

## 📄 Licencia

MIT — consulta el archivo [LICENSE](LICENSE) para más detalles.

---

*Hecho con ⚽ para el Mundial 2026 y más allá.*
