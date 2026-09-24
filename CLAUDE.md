# Klau's Shop — Titan Factory (capa de agente sobre un proyecto existente)

> Tienda online de ropa y accesorios para Cuba (zona de Villa Clara), con panel admin propio.
> Pedidos por WhatsApp, precios en CUP, pago fuera de la app.
> Titan Factory se instalo el 2026-09-24 **solo como capa de agente** (skills, subagentes, memoria).
> El codigo de la app NO sigue el Golden Path de Titan Factory: aqui manda el stack real (ver abajo).

---

## Al Empezar Cada Sesion

1. Leer `.claude/memory/MEMORY.md` y los archivos relevantes ANTES de tocar codigo.
2. Si un skill asume el Golden Path (Next 16, Polar, Prisma, Playwright...), **el stack real de este archivo gana**.
   Adapta el skill al proyecto; no migres el proyecto al skill.

---

## Los 4 Comportamientos (Anti-Fallos de Codigo)

Aplican a TODO el trabajo: features, fixes, refactors.

1. **Pensar antes de codificar** — Declara supuestos. Si hay varias interpretaciones, presentalas. Si algo no esta claro, pregunta.
   El usuario es tecnico (mantiene el repo), pero las decisiones de producto las toma el.
2. **Simplicidad primero** — El minimo codigo que resuelve el problema. Sin abstracciones ni configurabilidad especulativa.
3. **Cambios quirurgicos** — Toca solo lo necesario. Sigue el estilo existente. Codigo muerto no relacionado: mencionalo, no lo borres.
4. **Ejecucion orientada a objetivos** — Define criterios verificables (test, typecheck, build, prueba manual) e itera hasta cumplirlos.
   Para tareas multi-paso: plan breve `Paso → verificar: check`.

---

## Stack Real (NO es el Golden Path)

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
| Tests | Jest + Testing Library (cobertura minima). Cypress instalado sin uso |
| Deploy | Vercel (GitHub `rcalvarez37201/klauShop`, rama `main`) |

**Prohibido sin pedirlo el usuario:** migrar a Next 16/React 19, cambiar Drizzle por otro ORM, sustituir GraphQL por
queries directas, introducir Polar/Prisma. Detalle y motivo en memoria (`project/decision-no-golden-path.md`).

---

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

---

## Reglas del Dominio

- **Moneda:** CUP. Todo el copy visible al cliente y al admin en **espanol**.
- **Admin:** se determina por `user.app_metadata.isAdmin` (NO por `profiles.is_admin`). Se otorga con `/api/users/promote-user`.
- **Pedidos:** ciclo `pending_confirmation → pending_payment → paid → processing → shipped → delivered` (+ `cancelled`).
  Transiciones validas en `src/features/orders/utils/orderStatus.tsx`. `paid` solo via endpoint `mark-paid`
  (consume reservas y descuenta stock). Cancelar via endpoint `cancel` (libera reservas).
- **Inventario:** reserva blanda en `inventory_reservations` al crear la orden; stock real se descuenta al marcar pagada.
- **SEO:** metadata de paginas via `getPageMetadata()` de `src/config/site.ts`.

---

## Reglas de Codigo

- Identificadores, comentarios nuevos, nombres de archivo y commits en **ingles**. Copy de UI en espanol.
  (El codigo heredado tiene comentarios en espanol: no los traduzcas si no tocas esa zona.)
- Componentes `PascalCase.tsx`; funciones/variables `camelCase`.
- Validar con Zod toda entrada de usuario en route handlers y actions.
- Operaciones que tocan stock/ordenes: dentro de `db.transaction` con `.for("update")` donde aplique.
- Nuevo `any` prohibido (usar `unknown`); el codigo existente tiene algunos, no los "arregles" de paso.
- Si cambias queries GraphQL → `npm run codegen`. Si cambias el esquema de BD en Supabase → `npm run codegen:fetch` y luego `codegen`.
- Cliente Supabase con service role: `createClient({ cookieStore, isAdmin: true })` — no adjunta cookies a proposito.
- NUNCA exponer secrets. El nombre `STRIPE_WEBHOOK_SECERT_KEY` (con typo) es el real: no lo renombres sin coordinar env vars.
- RLS habilitado en tablas nuevas; politicas en `drizzle/rls_policies.sql` (`npm run db:apply-rls`).

---

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

---

## Skills de Titan Factory: Cuales Aplican Aqui

| Skill | Uso en klauShop |
|-------|-----------------|
| `primer`, `memory-manager` | Siempre. Memoria en `.claude/memory/` (git-versioned) |
| `prp` → `bucle-agentico` | Features complejas (DB + API + UI) |
| `supabase` | BD, RLS, queries — respetando Drizzle como fuente del esquema |
| `playwright-cli` | Verificacion en navegador (no hay suite e2e propia) |
| `add-emails`, `add-mobile`, `ai`, `image-generation` | Aplicables, adaptando a Next 14 / React 18 |
| n8n suite | Si se automatizan pedidos/notificaciones fuera de la app |
| `skill-creator`, `autoresearch`, `tasknic` | Uso general |
| `new-app`, `add-login` | **No aplican**: el negocio y la auth ya existen |
| `add-payments` (Polar), `easypanel-deploy` (Prisma) | **No aplican** tal cual: pagos por WhatsApp/Stripe, BD Supabase |
| `eject-tf`, `update-tf` | Cuidado: asumen la estructura del template (tocan `src/app/page.tsx`, `package.json`). Revisar antes de ejecutar |

---

## Subagentes: Delegacion SOLO con Permiso

En `.claude/agents/`: backend-specialist, frontend-specialist, supabase-admin, codebase-analyst,
vercel-deployer, gestor-documentacion, validacion-calidad.

1. Se invocan a peticion del usuario.
2. Si consideras util delegar, **pide permiso ANTES**, cada vez. Una aprobacion anterior no cubre la siguiente.

---

## MCPs

Configurados en `.mcp.json` (no commitear con secrets reales): next-devtools, playwright, supabase, n8n-mcp.
Supabase y n8n requieren rellenar `project-ref`/tokens. Si un MCP no conecta, trabajar con CLI/codigo y avisar.

---

## Auto-Blindaje

Error → fix → documentar. Errores de una feature en su PRP; patrones recurrentes en `.claude/memory/reference/`;
reglas criticas para todo el proyecto en este archivo.
