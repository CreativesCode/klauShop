# Memoria del Proyecto — Indice

> Archivos organizados por carpeta (tipo). Max 200 lineas.
> Gestionado por skill tf-memory-manager. Compartida por Claude Code y Codex. Auto-memory de Claude Code DESACTIVADO.

## user/ — Sobre el usuario/equipo

- [equipo.md](user/equipo.md) — Repo, mantenedor, idioma (espanol) y estilo de commits

## project/ — Proyectos y decisiones activas

- [negocio-klaushop.md](project/negocio-klaushop.md) — Que vende, mercado (Cuba/CUP), checkout WhatsApp, origen fork de Hiyori
- [decision-no-golden-path.md](project/decision-no-golden-path.md) — 2026-09-24: TF solo como capa de agente; no migrar el stack
- [riesgos-detectados-2026-09-24.md](project/riesgos-detectados-2026-09-24.md) — Analisis inicial; SUPERADO en gran parte por qa-piloto-cuba (ver esa entrada)
- [2026-10-02-dual-agent-tooling.md](project/2026-10-02-dual-agent-tooling.md) — Claude Code + Codex en el repo (copiado de lensspace), memoria en .titan/, skills tf-, MCP Supabase OAuth
- [qa-piloto-cuba-2026-10-02.md](project/qa-piloto-cuba-2026-10-02.md) — QA pre-piloto: Fases 0-3 en main (0018-0023 aplicadas), siguiente Fase 4; decisiones del dueño, reglas nuevas, pendientes y lecciones

## feedback/ — Correcciones y preferencias

- [tono-mensajes-whatsapp.md](feedback/tono-mensajes-whatsapp.md) — Mensajes al cliente: educados, remitir a telefonos de admins, sin "responde" ni links de orden
- [secretos-en-assets-titan-factory.md](feedback/secretos-en-assets-titan-factory.md) — Imagenes pueden llevar API keys en metadatos; escanear binarios antes de push

## reference/ — Donde encontrar cosas

- [flujo-pedidos-inventario.md](reference/flujo-pedidos-inventario.md) — Transiciones de estado (fuente unica), endpoints admin, reservas/stock, precios de lineas
- [whatsapp-openwa.md](reference/whatsapp-openwa.md) — Avisos auto por WhatsApp (0014-0016, 0019 aplicadas): trigger orders -> pg_net -> OpenWA; 500 en pg_net pero los mensajes llegan
- [acceso-bd-sin-mcp.md](reference/acceso-bd-sin-mcp.md) — Consultar/aplicar SQL con node+postgres y DATABASE_URL (es produccion) cuando el MCP falla
- [auth-y-datos.md](reference/auth-y-datos.md) — Admin via app_metadata.isAdmin, requireAdmin en actions, middleware de sesion, service role con Bearer, RLS 0018
- [subida-imagenes.md](reference/subida-imagenes.md) — Limite 4.5MB de Vercel, recorte/compresion en cliente, estados por archivo, /api/medias solo admin
- [modales-slots-paralelos.md](reference/modales-slots-paralelos.md) — Cerrar modales @slot con router.back(); push+refresh re-renderiza el slot viejo -> 404
