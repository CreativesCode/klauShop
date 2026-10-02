# Modales con slots paralelos (@mediaModal) — cerrar sin 404

- `/admin/medias` usa un slot paralelo `@mediaModal/[mediaId]` (no es intercepting route) + `default.tsx` que devuelve null.
- En navegacion cliente, Next **mantiene activo el slot** aunque cambie la URL. Si tras una accion haces
  `router.push(lista) + router.refresh()`, el refresh re-renderiza el slot con el id viejo.
- Si ese recurso fue borrado -> `notFound()` -> **404 de pagina completa** (bug visto 2026-09-25 al eliminar una media).
- Regla: cerrar estos modales con `router.back()` (como `CloseButton`), no con push+refresh.
  Y en la page del slot, si el recurso no existe devolver `null`, no `notFound()`.
