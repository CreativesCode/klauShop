# Decision: klauShop NO se migra al Golden Path de Titan Factory

**Fecha:** 2026-09-24

Titan Factory se instalo sobre un proyecto ya en produccion copiando SOLO la capa de agente:
`.claude/`, `CLAUDE.md`, `GEMINI.md`, `.mcp.json`. NO se copiaron `src/`, `package.json` ni configs del template.

**Por que:** la app ya funciona con Next 14 / React 18 / Drizzle / pg_graphql + urql / S3 / checkout WhatsApp.
Migrar a Next 16 + React 19 + Polar + Supabase directo romperia la tienda sin beneficio para el negocio.

**Como aplicar:**
- Cuando un skill de Titan Factory asuma el Golden Path, adaptar el skill al stack real, no al reves.
- `eject-tf` y `update-tf` asumen la estructura del template: revisar lo que tocan antes de ejecutarlos.
- Cualquier upgrade de framework (Next 15/16, React 19) es una decision explicita del usuario, via PRP.
