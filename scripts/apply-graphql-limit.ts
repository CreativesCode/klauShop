/**
 * Script para aplicar el límite de GraphQL max_rows al esquema y tablas
 * Basado en la documentación oficial de pg_graphql:
 * https://supabase.github.io/pg_graphql/configuration/#max-rows
 *
 * Ejecutar con: npm run db:apply-graphql-limit
 */

import postgres from "postgres";

async function applyGraphQLLimit() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false });

  try {
    console.log(
      "🔧 Aplicando límite de GraphQL según la documentación oficial...",
    );
    console.log(
      "📖 Referencia: https://supabase.github.io/pg_graphql/configuration/#max-rows\n",
    );

    // Según la documentación, el límite predeterminado es 30
    // Para cambiarlo, se debe aplicar el comentario al SCHEMA
    const maxRows = 1000;

    // Aplicar al esquema public (que es donde están las tablas)
    const publicSchemaStatement = `COMMENT ON SCHEMA public IS e'@graphql({"max_rows": ${maxRows}})';`;
    await sql.unsafe(publicSchemaStatement);
    console.log(`✅ Límite de ${maxRows} aplicado al esquema public`);

    // También aplicar a la tabla products
    const tableStatement = `COMMENT ON TABLE public.products IS e'@graphql({"max_rows": ${maxRows}})';`;
    await sql.unsafe(tableStatement);
    console.log(`✅ Límite de ${maxRows} aplicado a la tabla products`);

    console.log("\n✅ Configuración completada exitosamente!");
    console.log(
      "\n💡 Nota: Si el cambio no se refleja inmediatamente, puede ser necesario refrescar el schema GraphQL en el dashboard de Supabase.",
    );
  } catch (error: any) {
    console.error("❌ Error aplicando límite de GraphQL:", error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyGraphQLLimit();
