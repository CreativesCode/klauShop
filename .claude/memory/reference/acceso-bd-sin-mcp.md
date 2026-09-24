# Acceso a la BD cuando el MCP de Supabase no conecta

El MCP de Supabase da "Unauthorized" (falta SUPABASE_ACCESS_TOKEN en .mcp.json). Alternativa que funciona
(usada 2026-09-24 para aplicar 0015/0016 y resetear una orden):

```bash
node -e "
require('dotenv').config();
const sql=require('postgres')(process.env.DATABASE_URL,{prepare:false});
(async()=>{ console.log(await sql\`select ...\`); await sql.end(); })();
"
```
- `DATABASE_URL` de `.env` apunta a **produccion** (no hay BD de staging): leer primero, escribir solo con permiso explicito.
- Aplicar un .sql: `sql.begin(tx => tx.unsafe(fs.readFileSync(file,'utf8')))` (transaccion; multi-statement OK).
- Updates con guardas en el WHERE (estado esperado) y `returning` para verificar.
