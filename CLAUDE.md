@AGENTS.md

<!-- titan-factory-claude:start -->
# Titan Factory (Claude Code) — Klau's Shop

`AGENTS.md` (importado arriba) contiene las reglas del proyecto comunes a Claude Code y Codex
(stack real, arquitectura, dominio, reglas de codigo, comandos). Este bloque agrega lo propio
de Claude Code. Si algo choca, gana la instruccion explicita del usuario, luego `AGENTS.md`,
luego este bloque.

## Memoria compartida con Codex (SIEMPRE ACTIVA)

Claude Code y Codex comparten **una sola** memoria versionada en git:

| Que | Donde |
|-----|-------|
| Decisiones, feedback, referencias | `.titan/memory/` (indice: `MEMORY.md`) |
| PRPs / planes de features | `.titan/plans/` (plantilla: `prp-base.md`) |
| Evidencia de QA (notas, capturas) | `.titan/qa/` |

- Al empezar una tarea relevante, lee `.titan/memory/MEMORY.md` y solo las entradas
  relacionadas (`tf-primer` lo hace al inicio de sesion; `tf-memory-manager` define formato).
- Auto-memory de Claude Code esta desactivada en `.claude/settings.json`. NUNCA crees
  `.claude/memory/` ni otra copia de la memoria.
- Puede haber entradas escritas por Codex: tratalas igual. El codigo actual gana sobre una
  nota vieja; marca lo superado en vez de borrarlo.
- Las tareas de solo lectura no escriben memoria. Nunca guardes credenciales.

## Coexistencia con Titan Factory Codex

| Claude Code | Codex |
|-------------|-------|
| `CLAUDE.md` (+ `@AGENTS.md`) | `AGENTS.md` |
| `.claude/skills/tf-*` | `plugins/titan-factory-codex/skills/tf-*` |
| `.claude/agents/tf-*.md` | `.codex/agents/tf-*.toml` |
| `.claude/skills/{supabase,…}` (puentes) | `.agents/skills/` (fuente real, `skills-lock.json`) |
| `.mcp.json` | MCP configurado en cada instalacion de Codex |

Los skills tienen el mismo nombre en ambos lados. No edites `plugins/`, `.codex/` ni
`.agents/` salvo que la tarea sea sobre Codex o los skills compartidos. Para actualizar la
fabrica de Claude usa `tf-update-tf` (nunca copies el template encima).

## Que skill usar en klauShop

```
├── Feature compleja (DB + API + UI, varias fases)
│       → tf-prp (plan en .titan/plans/) → usuario aprueba → tf-bucle-agentico
├── Base de datos, RLS, queries, pg_net/triggers
│       → tf-supabase + supabase + supabase-postgres-best-practices
│         (Drizzle sigue siendo la fuente del esquema; migraciones en drizzle/)
├── Revisar / testear / bug en UI → tf-playwright-cli (no hay suite e2e propia; evidencia en .titan/qa/)
├── Emails / PWA-push / IA / imagenes
│       → tf-add-emails / tf-add-mobile / tf-ai / tf-image-generation (adaptar a Next 14 / React 18)
├── Logo / marca                  → logo-design
├── Automatizaciones / n8n        → tf-n8n-mcp-tools-expert primero, luego tf-n8n-workflow-patterns
├── Manual de usuario             → tf-add-manual
├── "Recuerda…", "en que quedamos" → tf-memory-manager
├── Contexto del proyecto         → tf-primer
├── Crear/optimizar skills        → tf-skill-creator / tf-autoresearch
├── Tareas del equipo             → tf-tasknic
└── Nada encaja → leer el codigo, seguir sus patrones y ejecutar
```

**No aplican tal cual:**
- `tf-new-app`, `tf-add-login`: el negocio y la auth ya existen (extender, no reemplazar).
- `tf-add-payments` (Polar), `tf-easypanel-deploy` (Prisma): pagos por WhatsApp/Stripe, BD Supabase, deploy en Vercel.
- `tf-eject-tf`, `tf-update-tf`: revisar antes de ejecutar; `tf-eject-tf` es DESTRUCTIVO (confirmar siempre).

Integraciones opcionales (Polar, Resend, OpenRouter, n8n…) no reemplazan en silencio lo que el
proyecto ya usa (checkout y notificaciones por WhatsApp/OpenWA).

## Subagentes: solo con permiso

`.claude/agents/` tiene 7 subagentes `tf-*` (backend-specialist, frontend-specialist,
supabase-admin, codebase-analyst, vercel-deployer, gestor-documentacion, validacion-calidad).

1. Se invocan a peticion del usuario.
2. Si consideras util delegar, **pide permiso ANTES**, cada vez. Una aprobacion anterior no cubre la siguiente.

## MCPs

`.mcp.json` (versionado, sin secretos) define `supabase`, `next-devtools`, `playwright` y `n8n-mcp`.
`supabase` es el servidor remoto `https://mcp.supabase.com/mcp` con login OAuth en el navegador
(`/mcp` → supabase → Authenticate); no usa tokens. `n8n-mcp` necesita `N8N_API_URL`/`N8N_API_KEY`
en el entorno. Si un MCP no conecta, trabajar con CLI/codigo y avisar
(ver `.titan/memory/reference/acceso-bd-sin-mcp.md`). Setup completo: `docs/AGENT_SETUP.md`.
<!-- titan-factory-claude:end -->
