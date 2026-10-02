# Tono de los mensajes automaticos al cliente (WhatsApp)

Feedback del usuario 2026-09-24 al probar las notificaciones OpenWA:
- **Tono educado y cercano**, en espanol ("con gusto te ayudamos", "puedes escribirle...").
- **Nunca pedir "responde a este mensaje"**: el numero de OpenWA no lo atiende nadie. Remitir a los telefonos
  de los administradores registrados (`profiles.phone` de admins).
- **No mandar al cliente enlaces a la orden**: puede ser invitado o la orden la creo un admin, y no la podria ver.
  Los enlaces de orden son para admins (`/admin/orders/{id}`).

Why: el cliente final esta en Cuba, contacta por WhatsApp personal; un mensaje que no se puede responder o un
link que no abre genera desconfianza.
How to apply: cualquier mensaje nuevo al cliente (WhatsApp, email futuro) sigue estas tres reglas.
