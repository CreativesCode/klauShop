<!-- titan-factory-codex:start -->
## Titan Factory Codex

- At the start of a relevant project task, read `.titan/memory/MEMORY.md` if present and only its relevant linked entries.
- Use available `tf-` skills for matching work. Skills do not imply connected services or permission for unrelated actions.
- This is an existing app on its own stack (see below). Never migrate it to the Titan Factory golden path. Preserve this project's existing stack and the user's explicit choices.
- Keep project decisions in `.titan/memory/`, feature plans in `.titan/plans/` and useful QA evidence in `.titan/qa/`. Read-only tasks must not write state.
- Reuse authorization already given for the task. Delegate only when the user requests or authorizes delegation; do not launch agents merely because role files exist.
- Preserve local code and project knowledge during toolkit updates. Never store credentials in shared memory.
<!-- titan-factory-codex:end -->

<!-- titan-factory-shared:start -->
## Shared agent tooling

- This repository hosts two Titan Factory toolboxes: Codex (`plugins/titan-factory-codex/`, `.codex/`, `.agents/`) and Claude Code (`CLAUDE.md`, `.claude/`). Both use the same `tf-` skill names.
- Both share one project memory: `.titan/memory/` (plus `.titan/plans/` and `.titan/qa/`). Never create a second copy such as `.claude/memory/`. Entries may come from either agent; keep the existing format (plain Markdown, `# Title`, one-line index entries appended to `MEMORY.md`).
- Do not modify the other agent's toolbox unless the task is about it. Setup for both agents: `docs/AGENT_SETUP.md`.
<!-- titan-factory-shared:end -->

# Klau's Shop — reglas del proyecto (comunes a Claude Code y Codex)

> Tienda online de ropa y accesorios para Cuba (zona de Villa Clara), con panel admin propio.
> Pedidos por WhatsApp, precios en CUP, pago fuera de la app.
> Titan Factory se instalo el 2026-09-24 **solo como capa de agente** (skills, subagentes, memoria).
> El codigo de la app NO sigue el Golden Path de Titan Factory: aqui manda el stack real (ver abajo).

## Al empezar cada sesion

1. Leer `.titan/memory/MEMORY.md` y los archivos relevantes ANTES de tocar codigo.
2. Si un skill asume el Golden Path (Next 16, Polar, Prisma, Playwright...), **el stack real de este archivo gana**.
   Adapta el skill al proyecto; no migres el proyecto al skill.

## Los 4 comportamientos (anti-fallos de codigo)

Aplican a TODO el trabajo: features, fixes, refactors.

1. **Pensar antes de codificar** — Declara supuestos. Si hay varias interpretaciones, presentalas. Si algo no esta claro, pregunta.
   El usuario es tecnico (mantiene el repo), pero las decisiones de producto las toma el.
2. **Simplicidad primero** — El minimo codigo que resuelve el problema. Sin abstracciones ni configurabilidad especulativa.
3. **Cambios quirurgicos** — Toca solo lo necesario. Sigue el estilo existente. Codigo muerto no relacionado: mencionalo, no lo borres.
4. **Ejecucion orientada a objetivos** — Define criterios verificables (test, typecheck, build, prueba manual) e itera hasta cumplirlos.
   Para tareas multi-paso: plan breve `Paso → verificar: check`.

## Stack real (NO es el Golden Path)

| Capa | Tecnologia |
|------|------------|
| Framework | **Next.js 14.2** (App Router) + **React 18** + TypeScript |
| Estilos | Tailwind 3 + shadcn/ui (Radix) + framer-motion |
| Auth | Supabase Auth (email/password + OAuth Google/GitHub) via `@supabase/ssr` y `@supabase/auth-helpers-nextjs` |
| Lecturas | **pg_graphql** de Supabase + **urql** (`src/lib/urql.ts`, `src/lib/urql-service.ts`), tipos con **graphql-codegen** en `src/gql/` |
| Escrituras / transacciones | **Drizzle ORM** (`src/lib/supabase/db.ts`, esquema en `src/lib/supabase/schema.ts`) |
| Migraciones | drizzle-kit → `drizzle/*.sql` + `drizzle/rls_policies.sql` |
| Estado cliente | Zustand (carrito invitado, wishlist, busqueda). Redux Toolkit esta en package.json pero sin uso |
| Formularios / validacion | react-hook-form + Zod; env validado con `@t3-oss/env-nextjs` (`src/env.mjs`) |
| Media | **Supabase Storage via API S3-compatible** (`src/lib/s3.ts`, bucket `klaushop`) |
| Checkout | **WhatsApp** (activo). Stripe existe pero esta **desactivado** en la UI |
| Notificaciones | WhatsApp automatico via OpenWA (trigger en `orders` → pg_net) |
| Tests | Jest + Testing Library (cobertura minima). Cypress instalado sin uso |
| Deploy | Vercel (GitHub `CreativesCode/klauShop`, rama `main`) |

**Prohibido sin pedirlo el usuario:** migrar a Next 16/React 19, cambiar Drizzle por otro ORM, sustituir GraphQL por
queries directas, introducir Polar/Prisma. Detalle y motivo en memoria (`.titan/memory/project/decision-no-golden-path.md`).

## Arquitectura

```
src/
├── app/
│   ├── (store)/        # Tienda publica: /, /shop, /shop/[slug], /collections/[slug], /cart, /wish-list,
│   │                   #   /orders, /setting/*, /special-orders, /about-us
│   ├── (auth)/         # /sign-in, /sign-up, reset-password, auth/callback
│   ├── (admin)/admin/  # CMS: dashboard, products, collections, orders, medias, users, shipping-zones
│   ├── order/[orderId] # Redirector: admin → /admin/orders/:id, cliente → /orders/:id (link del WhatsApp)
│   └── api/            # Route handlers (checkout, pedidos admin, stock, direcciones, medias, webhook Stripe)
├── features/[feature]/ # components/, hooks/, validations/, actions.ts, query.ts — exporta via index.ts
├── _actions/           # Server actions legacy (products, collections, medias, orders)
├── components/         # ui/ (shadcn), layouts/, forms/, admin/
├── lib/                # supabase/ (clients, db, schema, seed), urql, s3, stripe, utils
├── config/site.ts      # Nombre, WhatsApp, zonas, prefijo de orden "KS", getPageMetadata()
└── gql/                # GENERADO por codegen — no editar a mano
```

Convencion de features: importar desde `@/features/x`, no desde subrutas internas (ver `docs/project-structure.md`).

## Reglas del dominio

- **Moneda:** CUP. Todo el copy visible al cliente y al admin en **espanol**.
- **Admin:** se determina por `user.app_metadata.isAdmin` (NO por `profiles.is_admin`). Se otorga con `/api/users/promote-user`.
- **Pedidos:** ciclo `pending_confirmation → pending_payment → paid → processing → shipped → delivered` (+ `cancelled`).
  Transiciones validas en `src/features/orders/utils/orderStatus.tsx`. `paid` solo via endpoint `mark-paid`
  (consume reservas y descuenta stock). Cancelar via endpoint `cancel` (libera reservas).
- **Inventario:** reserva blanda en `inventory_reservations` al crear la orden; stock real se descuenta al marcar pagada.
- **SEO:** metadata de paginas via `getPageMetadata()` de `src/config/site.ts`.

## Reglas de codigo

- Identificadores, comentarios nuevos, nombres de archivo y commits en **ingles**. Copy de UI en espanol.
  (El codigo heredado tiene comentarios en espanol: no los traduzcas si no tocas esa zona.)
- Componentes `PascalCase.tsx`; funciones/variables `camelCase`.
- Validar con Zod toda entrada de usuario en route handlers y actions.
- Operaciones que tocan stock/ordenes: dentro de `db.transaction` con `.for("update")` donde aplique.
- Nuevo `any` prohibido (usar `unknown`); el codigo existente tiene algunos, no los "arregles" de paso.
- Si cambias queries GraphQL → `npm run codegen`. Si cambias el esquema de BD en Supabase → `npm run codegen:fetch` y luego `codegen`.
- Cliente Supabase con service role: `createClient({ cookieStore, isAdmin: true })` — no adjunta cookies a proposito.
- NUNCA exponer secrets (ni en codigo, ni en memoria, ni en `.mcp.json`). El nombre `STRIPE_WEBHOOK_SECERT_KEY` (con typo)
  es el real: no lo renombres sin coordinar env vars.
- RLS habilitado en tablas nuevas; politicas en `drizzle/rls_policies.sql` (`npm run db:apply-rls`).

## Comandos

```bash
npm run dev                    # Desarrollo (next dev)
npm run build                  # codegen + next build
npx tsc --noEmit               # Typecheck (no hay script npm)
npm run lint                   # ESLint
npm test                       # Jest
npm run codegen                # Regenerar tipos GraphQL (src/gql)
npm run codegen:fetch          # Descargar schema GraphQL de Supabase
npm run db:generate            # Generar migracion Drizzle
npm run db:push                # Aplicar esquema a la BD
npm run db:apply-rls           # Aplicar politicas RLS
npm run db:apply-graphql-limit # max_rows 1000 en pg_graphql
```

Pre-commit (husky): `npm run lint && npm run format`.

## Auto-blindaje

Error → fix → documentar. Errores de una feature en su plan (`.titan/plans/`); patrones recurrentes en
`.titan/memory/reference/`; reglas criticas para todo el proyecto en este archivo.
