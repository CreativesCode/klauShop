# MCP de Supabase con token por proyecto

- `.mcp.json` → `supabase`: `node scripts/supabase-mcp.mjs` (stdio). El script lee `SUPABASE_ACCESS_TOKEN`
  de `.env.local` y lanza `@supabase/mcp-server-supabase@latest --project-ref=bhwyagfoyylgrdgyngrm`.
- Sustituye al MCP remoto con OAuth (configurado 2026-10-20). Motivo: cada proyecto usa una cuenta Supabase
  distinta y el login/variable global apuntaba a otra cuenta.
- Klau's Shop vive en la cuenta Supabase "robert" (junto a "Self inspection"). El token NUNCA va a git ni a memoria.
- Si falta la linea en `.env.local`, el server usa la variable global de Windows y puede entrar en OTRA cuenta.
- CLI: la funcion `supabase` del perfil de PowerShell usa el mismo `.env.local` si se ejecuta desde la raiz.
- Tras cambiar el token: recargar VS Code / reiniciar Claude Code.
