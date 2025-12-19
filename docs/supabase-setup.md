# Guía para Generar Tablas en Supabase

Este proyecto usa **Drizzle ORM** para gestionar el esquema de base de datos y conectarse a Supabase.

## 📋 Prerrequisitos

1. Tener un proyecto creado en [Supabase](https://supabase.com)
2. Obtener las credenciales de tu proyecto Supabase

## 🔧 Paso 1: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# URL de conexión a Supabase (Connection Pooling)
# Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.TU_PROJECT_REF.supabase.co:5432/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PROJECT_REF=TU_PROJECT_REF
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
DATABASE_SERVICE_ROLE=tu_service_role_key_aqui

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# S3 Configuration (para almacenamiento de imágenes)
NEXT_PUBLIC_S3_BUCKET=tu_bucket
NEXT_PUBLIC_S3_REGION=tu_region
S3_ACCESS_KEY_ID=tu_access_key
S3_SECRET_ACCESS_KEY=tu_secret_key
S3_ENDPOINT=tu_endpoint

# Stripe (opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
STRIPE_SECRET_KEY=tu_stripe_secret_key
STRIPE_WEBHOOK_SECERT_KEY=tu_stripe_webhook_secret
```

### 🔑 Cómo obtener las credenciales de Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Copia:

   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project Reference** → `NEXT_PUBLIC_SUPABASE_PROJECT_REF`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `DATABASE_SERVICE_ROLE`

4. Para `DATABASE_URL`:
   - Ve a **Settings** → **Database**
   - Busca la sección **Connection string** → **URI**
   - Usa el formato: `postgresql://postgres:[TU_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
   - Reemplaza `[TU_PASSWORD]` con la contraseña de tu base de datos (la que configuraste al crear el proyecto)

## 🗄️ Paso 2: Generar las Tablas

Una vez configuradas las variables de entorno, tienes **dos opciones**:

### Opción A: Push Directo (Recomendado para Desarrollo) ⚡

Aplica directamente los cambios del esquema a la base de datos:

```bash
npm run db:push
```

Este comando:

- Lee el esquema de `src/lib/supabase/schema.ts`
- Compara con la base de datos actual
- Aplica los cambios automáticamente

**Ventajas:**

- ✅ Rápido y directo
- ✅ Ideal para desarrollo
- ✅ No necesitas gestionar archivos de migración

**Desventajas:**

- ⚠️ No genera historial de migraciones
- ⚠️ Puede ser destructivo si hay datos

### Opción B: Generar Migraciones (Recomendado para Producción) 📦

Genera archivos SQL de migración que puedes revisar antes de aplicar:

```bash
# 1. Generar las migraciones
npm run db:generate

# 2. Revisar los archivos generados en la carpeta drizzle/

# 3. Aplicar las migraciones manualmente en Supabase:
#    - Ve a SQL Editor en Supabase Dashboard
#    - Copia y pega el contenido de los archivos .sql generados
#    - Ejecuta las migraciones en orden
```

**Ventajas:**

- ✅ Control total sobre los cambios
- ✅ Historial de migraciones
- ✅ Ideal para producción
- ✅ Puedes revisar antes de aplicar

**Desventajas:**

- ⚠️ Más pasos
- ⚠️ Requiere aplicar manualmente

## 📊 Paso 3: Verificar las Tablas

Puedes usar Drizzle Studio para visualizar tu base de datos:

```bash
npm run db:studio
```

Esto abrirá una interfaz web en `http://localhost:4983` donde podrás ver todas tus tablas y datos.

## 🌱 Paso 4: Poblar con Datos de Prueba (Opcional)

Si quieres agregar datos de ejemplo:

```bash
npm run db:seed
```

## 📝 Esquema de Tablas

El proyecto incluye las siguientes tablas (definidas en `src/lib/supabase/schema.ts`):

- `profiles` - Perfiles de usuario
- `products` - Productos del catálogo
- `collections` - Colecciones de productos
- `medias` - Archivos multimedia
- `product_medias` - Relación productos-media
- `carts` - Carritos de compra
- `wishlist` - Lista de deseos
- `orders` - Pedidos
- `order_lines` - Líneas de pedido
- `inventory_reservations` - Reservas de inventario
- `address` - Direcciones de envío
- `shipping_zones` - Zonas de envío
- `comments` - Comentarios de productos

## 🔍 Comandos Disponibles

```bash
# Generar migraciones desde el esquema
npm run db:generate

# Aplicar cambios directamente
npm run db:push

# Introspectar base de datos existente
npm run db:pull

# Abrir Drizzle Studio
npm run db:studio

# Ejecutar seed de datos
npm run db:seed

# Eliminar todas las tablas (¡CUIDADO!)
npm run db:drop
```

## ⚠️ Troubleshooting

### Error: "Tenant or user not found"

- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la contraseña en la URL esté correctamente codificada (usa `%` para caracteres especiales)
- Verifica que el proyecto de Supabase esté activo

### Error: "Connection refused"

- Verifica que la URL de conexión sea correcta
- Asegúrate de que tu IP esté permitida en Supabase (Settings → Database → Connection Pooling)

### Error: "Table already exists"

- Si las tablas ya existen, usa `db:push` para sincronizar cambios
- O elimina las tablas manualmente desde Supabase Dashboard si quieres empezar de cero

## 📚 Recursos Adicionales

- [Documentación de Drizzle ORM](https://orm.drizzle.team/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Drizzle con Supabase](https://orm.drizzle.team/docs/get-started-postgresql)
