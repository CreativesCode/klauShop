/**
 * Script para verificar el esquema GraphQL de Supabase directamente
 * y ver si se actualizó el límite max_rows
 */

const SUPABASE_PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_PROJECT_REF || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing SUPABASE env vars");
  process.exit(1);
}

const introspectionQuery = `
  query IntrospectionQuery {
    __type(name: "Query") {
      fields {
        name
        args {
          name
          type {
            name
            kind
          }
        }
      }
    }
  }
`;

async function checkGraphQLSchema() {
  try {
    console.log("🔍 Verificando esquema GraphQL de Supabase...");

    const response = await fetch(
      `https://${SUPABASE_PROJECT_REF}.supabase.co/graphql/v1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          query: introspectionQuery,
        }),
      },
    );

    const result = await response.json();

    if (result.errors) {
      console.error("❌ Error en introspección:", result.errors);
      return;
    }

    const queryFields = result.data?.__type?.fields || [];
    const productsCollection = queryFields.find(
      (field) => field.name === "productsCollection",
    );

    if (productsCollection) {
      console.log("✅ Campo productsCollection encontrado");
      console.log("📋 Argumentos disponibles:");
      productsCollection.args.forEach((arg) => {
        console.log(`   - ${arg.name}: ${arg.type.name || arg.type.kind}`);
      });
    } else {
      console.log("❌ Campo productsCollection no encontrado");
    }

    // Intentar una query real para ver cuántos productos devuelve
    console.log("\n🧪 Probando query con first: 1000...");
    const testQuery = `
      query TestQuery {
        productsCollection(first: 1000) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;

    const testResponse = await fetch(
      `https://${SUPABASE_PROJECT_REF}.supabase.co/graphql/v1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          query: testQuery,
        }),
      },
    );

    const testResult = await testResponse.json();

    if (testResult.errors) {
      console.error("❌ Error en query de prueba:", testResult.errors);
      return;
    }

    const count = testResult.data?.productsCollection?.edges?.length || 0;
    console.log(`📊 Productos devueltos: ${count}`);

    if (count === 30) {
      console.log(
        "\n⚠️  Aún devuelve solo 30. El esquema GraphQL de Supabase necesita refrescarse.",
      );
      console.log(
        "💡 Solución: Ve al dashboard de Supabase → Settings → API → Refresh Schema",
      );
    } else if (count >= 33) {
      console.log("\n✅ ¡Funciona! El límite se aplicó correctamente.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkGraphQLSchema();
