# QA pre-piloto Cuba (2026-10-02)

Prueba general antes del piloto: 7 personas QA (invitado movil 3G, cliente registrado, admin de pedidos, admin de catalogo, integridad/API, rendimiento/conectividad y auditoria de cache), cada hallazgo verificado por 2 revisores escepticos. Entornos: dev :3001, build de prod :3002 y klau-shop.vercel.app. BD de PRODUCCION.

- Plan de correccion por fases (71 items: 3 criticos, 21 altos, 28 medios, 19 bajos): `.titan/plans/qa-piloto-cuba-2026-10-02.md`
- Evidencia y metricas: `.titan/qa/2026-10-02-piloto-cuba.md`. Datos QA a limpiar en prod: `.titan/qa/2026-10-02-datos-qa-ledger.jsonl`

Bloqueantes principales (estado 2026-10-02, sin corregir):
1. Server actions de admin (`src/_actions/*`, `features/users/actions.ts`) sin chequeo de auth: se pueden ejecutar sin sesion.
2. RLS de orders/order_lines/profiles abierta a anon (politicas "Service role…" TO public USING true que no estan en el repo): anon lee y edita pedidos.
3. No existe trigger para crear `profiles`: los clientes registrados no pueden comprar ni guardar direcciones (FK 500). Arreglar antes `is_admin()` (lee profiles.is_admin, que el propio usuario puede editar).
4. OpenWA devuelve 500 en el 100% de los envios (la sesion `robert-us` dice ready pero esta muerta) y no hay monitoreo.
5. Checkout sin idempotencia (duplicados al perder la respuesta), carrito invitado sin vaciar, >8 productos omitidos.
6. Data Cache de Next de 1 ano en /shop/[slug] y layout; /api/shipping-zones estatico; 0 revalidateTag/Path en el repo.
7. ~300 KB gzip de JS de admin en la tienda por los barrels de features.

Lo que si esta bien: integridad de stock del checkout (riesgos #3/#4 de 2026-09-24 ya resueltos en prod), precios y envio en el servidor, ciclo de estados admin y dashboard.

## Estado 2026-10-03 (rama `fix/pilot-qa-p0`, sin commitear)
- Datos QA borrados de prod por diff contra baseline: BD = estado previo a la QA.
- Punto 4 corregido por el dueño: OpenWA responde 500 pero **los mensajes SI llegan**. No es bloqueante; ignorar por ahora.
- P0-01 hecho (`requireAdmin()` en `src/lib/supabase/requireAdmin.ts`; `isAdmin` puro en `features/users/utils.ts`).
- P0-02/P0-03: codigo listo + `drizzle/0018_lockdown_rls.sql` probada con ROLLBACK, **sin aplicar**. Orden: desplegar el codigo
  (/admin/orders usa getServiceClient) y DESPUES aplicar 0018, si no la lista admin de pedidos queda vacia.
- Envios (decision del dueño: opcion A + bloquear "Confirmar orden"): "Recoger en tienda" (costo 0, zona "Recogida en tienda")
  y "Otra zona — acordar envio por WhatsApp" (costo NULL). Confirmar / marcar pagada exigen costo de envio.
  `drizzle/0019_whatsapp_shipping_to_agree.sql` (texto del aviso automatico) **sin aplicar**.
