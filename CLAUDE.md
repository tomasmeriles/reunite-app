# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Turborepo + pnpm workspaces with two apps and shared packages:

```
apps/
  backend/   — NestJS API (TypeScript, Prisma, PostgreSQL, Redis, S3/MinIO)
  web/       — React SPA (Vite, TanStack Router, React Query, shadcn/ui, Tailwind v4)
packages/
  eslint-config/
  typescript-config/
```

Infrastructure (local dev): `docker compose up` starts PostgreSQL, Redis, and MinIO. The apps themselves run on the host via `pnpm dev`.

## Commands

### Root (run from `/`)

```bash
pnpm dev           # start both apps in parallel (turbo)
pnpm build         # build all apps
pnpm lint          # lint all
pnpm format        # prettier all .ts/.tsx/.md
pnpm check-types   # typecheck all (turbo)
```

### Backend (`apps/backend`)

```bash
pnpm dev           # nest start --watch
pnpm build         # prisma generate + nest build
pnpm test          # jest
pnpm test:watch    # jest --watch
pnpm db:migrate    # prisma migrate dev
pnpm db:seed       # prisma db seed
pnpm db:reset      # migrate reset + seed
pnpm db:studio     # prisma studio
pnpm db:generate   # prisma generate (after schema changes)
```

### Web (`apps/web`)

```bash
pnpm dev           # vite dev server
pnpm build         # vite build
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest run
pnpm test:watch    # vitest
pnpm lint          # eslint app/
```

To run a single test file: `pnpm test -- path/to/file.spec.ts`

## Backend Architecture

**NestJS** with feature modules under `src/modules/` (events, users, attendance, chat, media, prizes, etc.) plus cross-cutting concerns:

- **`src/auth/`** — JWT + refresh token + OAuth (Google). Access tokens in httpOnly cookies; CSRF token in JS memory. `JwtAuthGuard` is global; mark public routes with `@Public()`.
- **`src/casl/`** — CASL-based authorization. `CaslAbilityFactory` builds per-user ability sets from their `EventStaff` memberships. Abilities are cached in Redis for 60 s via `AbilityCacheService`; invalidated on role/config changes. Use `@CheckPolicies((ability) => ability.can(...))` on controllers.
- **`src/common/base/transactional-service.base.ts`** — Services extend `TransactionalService` and use `this.db` (never `this.prisma` directly). `@Transactional()` on a method opens a Prisma interactive transaction stored in `AsyncLocalStorage`; nested calls automatically reuse it. `Propagation.REQUIRES_NEW` forces an independent transaction.
- **`src/common/helpers/prisma.helpers.ts`** — Shared Prisma utilities: `defined()` (strips undefined keys), `buildSearch()` (multi-field ilike), `dateRange()`, `toOrderBy()`, `paginate()`.
- **`src/storage/`** — S3-compatible object storage (MinIO locally). `StorageService` wraps PutObject/GetObject/presign. Images are processed with `sharp` before upload.
- **`src/queue/`** — BullMQ jobs backed by Redis. Extend `BaseProcessor` for workers.
- **`src/rtc/`** — Socket.io WebSocket gateways for real-time features (chat, etc.).

**Module pattern:** Each module folder has `controllers/`, `services/`, `dto/`, `selects/` (typed Prisma `include` shapes), and an `*.module.ts`. DTOs use `class-validator`. Selects define the payload types returned to the frontend.

**Authorization flow:** Controller → `@CheckPolicies` guard calls `ability.can(action, subject('Resource', conditions))` → CASL evaluates MongoDB-style conditions against the subject object.

## Frontend Architecture

**React 19 SPA** served by Vite. No Next.js — `apps/web` is a pure client-side app.

### Routing

`app/router.tsx` — All routes defined in one file using TanStack Router v1. Route tree: Root → Auth layout (unauthenticated) / App layout (protected) → leaf routes. Protected routes use `beforeLoad` to redirect to `/login`. The `App` layout wraps `NuqsAdapter` (for URL state) around `RouterProvider`.

### State management

- **Server state:** React Query (`@tanstack/react-query`). All hooks live in `app/hooks/api/` mirroring the API modules. Key factories pattern: `eventKeys.detail(id)`, etc.
- **URL state:** `nuqs` (`useQueryState`, `parseAsStringLiteral`). Routes that use search params declare `validateSearch` with a zod schema.
- **Auth/abilities:** `AuthContext` (`app/contexts/auth.tsx`) holds the current user and a CASL `AppAbility` instance built from the packed rules returned by `/auth/me`.

### Permissions

Two hooks in `app/hooks/use-permission.ts`:
- `usePermission(action, resource)` — global check
- `useEventPermission(action, resource, eventId)` — evaluates CASL conditions for event-scoped subjects
- `useEventAccess(eventId)` — unified hook returning a typed `EventAccess` object; the only place that merges staff CASL rules with attendee config gates

### Forms

All forms use `react-hook-form` + `zod`. Schema files in `app/lib/schemas/`. Reusable field wrappers in `app/components/forms/` (`FormTextField`, `FormTextareaField`, `FormDateTimeField`, `FormCardSelectField`, `FormLocationField`, etc.) all accept `control` + `name` + `label`. Multi-step forms use `useSteppedForm`.

### UI components

`app/components/ui/` — shadcn/ui components (Radix UI primitives + Tailwind). Adding new shadcn components: `pnpm dlx shadcn@latest add <name>` from `apps/web`.

`app/components/forms/` — Form field wrappers (always use these, not raw inputs).

`app/components/buttons/` — `LoadingButton` (animated spinner-in/content-out), `GoogleButton`.

`app/components/layout/` — `AppSidebar`, `AppHeader`.

`app/components/decorative/` — Decorative UI: `ConfettiBackground`, `DotGrid`.

### Styling

Tailwind CSS v4 with OKLch color variables. Primary: hot pink, secondary: mint green. Use Tailwind v4 canonical class names (e.g. `aspect-3/1`, `bg-linear-to-br` — not `aspect-[3/1]`, `bg-gradient-to-br`). Dark mode via `.dark` class (`next-themes`). Font: Geist Variable.

### API client

`app/lib/axios.ts` — Axios instance with CSRF token interceptor and automatic token refresh (queues requests during refresh). All API modules in `app/api/` export plain functions used by React Query hooks.

### Date/time

Luxon throughout. `app/lib/datetime.ts` exports helpers. Event dates stored in UTC; displayed/edited in the event's `timezone` field. Convert with `DateTime.fromISO(utc).setZone(tz)` when populating forms; convert back with `DateTime.fromISO(local, { zone: tz }).toISO()` on submit.

## Key Patterns

**Adding a backend feature:**
1. Add/update the Prisma model → `pnpm db:migrate`
2. Create DTO with class-validator decorators
3. Add service method in the relevant module's service (extend `TransactionalService`, use `@Transactional()` for writes)
4. Add controller endpoint with `@CheckPolicies`
5. If the feature changes who can do what, update `CaslAbilityFactory` and call `abilityCache.del(userId)` / `abilityCache.delMany(userIds)`

**Adding a frontend feature:**
1. Add types to `app/api/<module>/<module>.types.ts`
2. Add API function to `app/api/<module>/<module>.api.ts`
3. Add React Query hook to `app/hooks/api/use-<module>.ts`
4. Build the UI using existing form components and shadcn primitives
5. If the feature needs URL state, add `validateSearch` to the route and use `useQueryState`

**CASL condition matching:** Backend attaches conditions like `{ id: eventId }` (for `Event`) or `{ eventId }` (for other subjects). Frontend must pass the same shape via `subject('Resource', { id })` or `subject('Resource', { eventId })` — otherwise `ability.can()` returns false even for authorized users.

**Ability cache invalidation:** Any mutation that changes what a user is allowed to do must call `abilityCache.del(userId)` or `abilityCache.delMany(userIds)`. The frontend React Query must also invalidate `authKeys.me()` to rebuild the client-side ability.
