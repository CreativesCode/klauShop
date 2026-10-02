# Notificaciones automaticas por WhatsApp (OpenWA)

Implementado 2026-09-24. SQL manual (fuera del journal de drizzle, como 0013). **Estado: 0014, 0015 y 0016 APLICADAS en
produccion y probadas** (el mensaje llega al cliente). Codigo app (profiles.phone, card admin) sin commitear aun.
- `0014_whatsapp_notifications.sql` — pg_net, `profiles.phone`, `private_config`, triggers, helpers.
- `0015_whatsapp_admin_contacts.sql` — contactos de admins en vez de "responde", link admin, drop `wa_order_url`.
- `0016_whatsapp_polite_contacts.sql` — redaccion mas amable de la linea de contacto.
Cambios nuevos = migracion nueva (0017...), no editar una ya aplicada.

## Arquitectura (decision del usuario: "lo mas rapido y con menos carga en nuestros servidores")
Trigger en `orders` -> `public.send_wa()` -> `net.http_post` (pg_net, async tras COMMIT) -> OpenWA `send-text`.
- Sin Edge Function ni trabajo en Vercel: el request del cliente no espera a WhatsApp.
- `send_wa` nunca lanza error (EXCEPTION -> RAISE WARNING): un fallo de WhatsApp no rompe la orden.
- Rollback de la tx = no se envia nada (la cola de pg_net es transaccional).
- Distinto de Tasknic (que usa Edge Function `wa-notify` intermedia). Referencia: `docs-skills/OPENWA_INTEGRATION_GUIDE.md`.

## Que se envia
- INSERT orden (constraint trigger DEFERRABLE INITIALLY DEFERRED para ver `order_lines`): cliente (`orders.phone`) + admins.
- UPDATE `order_status` -> cliente: pending_payment, paid, processing, shipped, delivered, cancelled.
- Admins = `auth.users.raw_app_meta_data.isAdmin` + `profiles.phone` no vacio. Lo configuran en /setting/account (card solo admin).
- El checkout sigue abriendo wa.me (decision: mantener ambos).
- El numero de OpenWA NO se responde -> todo mensaje al cliente termina con `wa_admin_contacts()`:
  "💬 Si tienes alguna duda o pregunta, con gusto te ayudamos. Puedes escribirle a un administrador: +53..."
  (vacio si ningun admin tiene telefono). Nunca "responde a este mensaje". Ver feedback/tono-mensajes-whatsapp.md.
- El cliente NO recibe link de la orden (invitado / creada por admin no puede verla).
  Los admins reciben `/admin/orders/{id}` (`wa_admin_order_url`, usa `site_url` de private_config).
- `pending_confirmation` no envia nada: sirve para resetear ordenes de prueba sin disparar mensajes.

## Config
Tabla `private_config` (RLS sin policies, grants revocados): `openwa_base_url`, `openwa_api_key`,
`openwa_session_id` (UUID, no el name), `site_url`. Borrar `openwa_base_url` = kill switch.
Funciones con REVOKE a anon/authenticated (PostgREST y pg_graphql exponen funciones de `public`).

## Gotchas
- Telefono Cuba: 8 digitos -> se antepone 53; `+` se respeta (`wa_phone_to_chat_id`).
- Numero de orden en SQL `wa_order_number` duplica `formatOrderNumber()`: si cambia el prefijo "KS", cambiar ambos.
- OpenWA debe ser alcanzable por HTTPS publico desde Supabase (no localhost).
- Resetear una orden de prueba: solo si `payment_status='unpaid'` y reservas `active` (si no, descuadra stock).
- Debug de envios: `select * from net._http_response order by created desc` (guarda ~6h).
