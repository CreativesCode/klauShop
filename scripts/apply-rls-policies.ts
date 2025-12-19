/**
 * Script para aplicar todas las políticas RLS de Supabase
 * Ejecutar con: npm run db:apply-rls o tsx -r dotenv/config scripts/apply-rls-policies.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

async function applyRLSPolicies() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false });

  try {
    console.log("📋 Leyendo archivo de políticas RLS...");
    const sqlFile = readFileSync(
      join(process.cwd(), "drizzle", "rls_policies.sql"),
      "utf-8",
    );

    // Dividir el archivo en statements individuales
    // Remover comentarios y dividir por punto y coma
    const statements = sqlFile
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`🔧 Aplicando ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Saltar comentarios y líneas vacías
      if (
        statement.startsWith("--") ||
        statement.length === 0 ||
        statement === "\n"
      ) {
        continue;
      }

      try {
        await sql.unsafe(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} aplicado`);
      } catch (error: any) {
        // Si la política ya existe, continuar
        if (
          error.message?.includes("already exists") ||
          error.message?.includes("duplicate")
        ) {
          console.log(
            `⚠️  Statement ${i + 1}/${statements.length} ya existe, omitiendo...`,
          );
          continue;
        }

        // Si la función ya existe, continuar
        if (
          error.message?.includes("function") &&
          error.message?.includes("already exists")
        ) {
          console.log(
            `⚠️  Función en statement ${i + 1} ya existe, omitiendo...`,
          );
          continue;
        }

        console.error(`❌ Error en statement ${i + 1}:`, error.message);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log("✅ Todas las políticas RLS han sido aplicadas exitosamente");
  } catch (error) {
    console.error("❌ Error aplicando políticas RLS:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyRLSPolicies();
