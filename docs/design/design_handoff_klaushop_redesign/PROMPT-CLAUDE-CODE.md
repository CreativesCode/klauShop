# Prompt sugerido para Claude Code

Copia la carpeta `design_handoff_klaushop_redesign/` en la raíz del repo `klauShop/` y pega esto en Claude Code:

---

Vamos a aplicar el rediseño de Klau's Shop que está en `design_handoff_klaushop_redesign/`.

1. Lee en orden: `README.md`, `docs/05-AUDITORIA.md`, `docs/01-TOKENS.md`, `docs/02-COMPONENTS.md`, `docs/03-SCREENS.md`, `docs/04-PLAN.md`.
2. Los archivos de `design/*.dc.html` son prototipos HTML de referencia (ábrelos en el navegador si necesitas ver el comportamiento); NO se copian al proyecto. Los de `snippets/` son código de referencia para adaptar al repo.
3. Trabaja **fase por fase** según `docs/04-PLAN.md`. Al empezar cada fase, muéstrame el plan de archivos que vas a tocar; al terminarla, corre `npm run lint` y `npm test`, resume qué cambió y espera mi OK antes de la siguiente.
4. No cambies lógica de negocio (órdenes, stock, reservas, RLS, mensajes de WhatsApp, `formatPrice`). Si una pantalla necesita datos nuevos, usa solo las consultas indicadas con ➕ en `03-SCREENS.md`.
5. Respeta las "Reglas de oro" del README. Si algo no está especificado, aplica el componente base más cercano y avísame; no inventes UI nueva.
6. Si te faltan datos reales (dirección, email, url del sitio en `config/site.ts`), pregúntame.

Empieza por la Fase 0.
