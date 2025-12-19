-- Script para insertar todas las políticas RLS (Row Level Security) de Supabase
-- Ejecutar este script en Supabase SQL Editor o mediante migración

-- Función helper para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS PARA TABLA: profiles
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil (al registrarse)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Los admins pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Los admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: products
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer productos (público)
CREATE POLICY "Anyone can read products"
  ON public.products FOR SELECT
  USING (true);

-- Solo admins pueden insertar productos
CREATE POLICY "Only admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Solo admins pueden actualizar productos
CREATE POLICY "Only admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Solo admins pueden eliminar productos
CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: collections
-- ============================================
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer colecciones (público)
CREATE POLICY "Anyone can read collections"
  ON public.collections FOR SELECT
  USING (true);

-- Solo admins pueden insertar colecciones
CREATE POLICY "Only admins can insert collections"
  ON public.collections FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Solo admins pueden actualizar colecciones
CREATE POLICY "Only admins can update collections"
  ON public.collections FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Solo admins pueden eliminar colecciones
CREATE POLICY "Only admins can delete collections"
  ON public.collections FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: medias
-- ============================================
ALTER TABLE public.medias ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer medias (público)
CREATE POLICY "Anyone can read medias"
  ON public.medias FOR SELECT
  USING (true);

-- Solo admins pueden insertar medias
CREATE POLICY "Only admins can insert medias"
  ON public.medias FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Solo admins pueden actualizar medias
CREATE POLICY "Only admins can update medias"
  ON public.medias FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Solo admins pueden eliminar medias
CREATE POLICY "Only admins can delete medias"
  ON public.medias FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: product_medias
-- ============================================
ALTER TABLE public.product_medias ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer product_medias (público)
CREATE POLICY "Anyone can read product_medias"
  ON public.product_medias FOR SELECT
  USING (true);

-- Solo admins pueden insertar product_medias
CREATE POLICY "Only admins can insert product_medias"
  ON public.product_medias FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Solo admins pueden actualizar product_medias
CREATE POLICY "Only admins can update product_medias"
  ON public.product_medias FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Solo admins pueden eliminar product_medias
CREATE POLICY "Only admins can delete product_medias"
  ON public.product_medias FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: carts
-- ============================================
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer su propio carrito
CREATE POLICY "Users can read own cart"
  ON public.carts FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar en su propio carrito
CREATE POLICY "Users can insert own cart"
  ON public.carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio carrito
CREATE POLICY "Users can update own cart"
  ON public.carts FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar de su propio carrito
CREATE POLICY "Users can delete own cart"
  ON public.carts FOR DELETE
  USING (auth.uid() = user_id);

-- Los admins pueden leer todos los carritos
CREATE POLICY "Admins can read all carts"
  ON public.carts FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Los admins pueden eliminar todos los carritos
CREATE POLICY "Admins can delete all carts"
  ON public.carts FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: wishlist
-- ============================================
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer su propia wishlist
CREATE POLICY "Users can read own wishlist"
  ON public.wishlist FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar en su propia wishlist
CREATE POLICY "Users can insert own wishlist"
  ON public.wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar de su propia wishlist
CREATE POLICY "Users can delete own wishlist"
  ON public.wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- Los admins pueden leer todas las wishlists
CREATE POLICY "Admins can read all wishlists"
  ON public.wishlist FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: comments
-- ============================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer comentarios (público)
CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT
  USING (true);

-- Los usuarios autenticados pueden insertar comentarios
CREATE POLICY "Authenticated users can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = profileId);

-- Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = profileId);

-- Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = profileId);

-- Los admins pueden eliminar cualquier comentario
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: orders
-- ============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer sus propias órdenes
CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propias órdenes
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Los usuarios pueden actualizar sus propias órdenes (limitado)
CREATE POLICY "Users can update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Los admins pueden leer todas las órdenes
CREATE POLICY "Admins can read all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Los admins pueden actualizar todas las órdenes
CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Los admins pueden eliminar órdenes
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: order_lines
-- ============================================
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer las líneas de sus propias órdenes
CREATE POLICY "Users can read own order lines"
  ON public.order_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_lines."orderId"
      AND orders.user_id = auth.uid()
    )
  );

-- Los usuarios pueden insertar líneas en sus propias órdenes
CREATE POLICY "Users can insert own order lines"
  ON public.order_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_lines."orderId"
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Los admins pueden leer todas las líneas de órdenes
CREATE POLICY "Admins can read all order lines"
  ON public.order_lines FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Los admins pueden actualizar todas las líneas de órdenes
CREATE POLICY "Admins can update all order lines"
  ON public.order_lines FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Los admins pueden eliminar líneas de órdenes
CREATE POLICY "Admins can delete order lines"
  ON public.order_lines FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: address
-- ============================================
ALTER TABLE public.address ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer sus propias direcciones
CREATE POLICY "Users can read own addresses"
  ON public.address FOR SELECT
  USING (auth.uid() = "userProfileId");

-- Los usuarios pueden insertar sus propias direcciones
CREATE POLICY "Users can insert own addresses"
  ON public.address FOR INSERT
  WITH CHECK (auth.uid() = "userProfileId");

-- Los usuarios pueden actualizar sus propias direcciones
CREATE POLICY "Users can update own addresses"
  ON public.address FOR UPDATE
  USING (auth.uid() = "userProfileId");

-- Los usuarios pueden eliminar sus propias direcciones
CREATE POLICY "Users can delete own addresses"
  ON public.address FOR DELETE
  USING (auth.uid() = "userProfileId");

-- Los admins pueden leer todas las direcciones
CREATE POLICY "Admins can read all addresses"
  ON public.address FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Los admins pueden actualizar todas las direcciones
CREATE POLICY "Admins can update all addresses"
  ON public.address FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: shipping_zones
-- ============================================
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer zonas de envío (público para checkout)
CREATE POLICY "Anyone can read shipping zones"
  ON public.shipping_zones FOR SELECT
  USING (true);

-- Solo admins pueden insertar zonas de envío
CREATE POLICY "Only admins can insert shipping zones"
  ON public.shipping_zones FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Solo admins pueden actualizar zonas de envío
CREATE POLICY "Only admins can update shipping zones"
  ON public.shipping_zones FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Solo admins pueden eliminar zonas de envío
CREATE POLICY "Only admins can delete shipping zones"
  ON public.shipping_zones FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- POLÍTICAS PARA TABLA: inventory_reservations
-- ============================================
-- Nota: Esta tabla tiene RLS deshabilitado en la migración 0009
-- Si necesitas habilitarlo, descomenta las siguientes políticas:

-- ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer reservas de inventario
-- CREATE POLICY "Only admins can read inventory reservations"
--   ON public.inventory_reservations FOR SELECT
--   USING (public.is_admin(auth.uid()));

-- Solo admins pueden insertar reservas de inventario
-- CREATE POLICY "Only admins can insert inventory reservations"
--   ON public.inventory_reservations FOR INSERT
--   WITH CHECK (public.is_admin(auth.uid()));

-- Solo admins pueden actualizar reservas de inventario
-- CREATE POLICY "Only admins can update inventory reservations"
--   ON public.inventory_reservations FOR UPDATE
--   USING (public.is_admin(auth.uid()));

-- Solo admins pueden eliminar reservas de inventario
-- CREATE POLICY "Only admins can delete inventory reservations"
--   ON public.inventory_reservations FOR DELETE
--   USING (public.is_admin(auth.uid()));

-- ============================================
-- COMENTARIOS FINALES
-- ============================================
-- Este script habilita RLS y crea políticas para todas las tablas principales.
-- 
-- Para ejecutar:
-- 1. Copia el contenido de este archivo
-- 2. Ve al SQL Editor en Supabase Dashboard
-- 3. Pega y ejecuta el script
-- 
-- O ejecuta mediante migración:
-- psql $DATABASE_URL -f drizzle/rls_policies.sql
--
-- IMPORTANTE: Asegúrate de que la función is_admin() tenga permisos
-- SECURITY DEFINER para que funcione correctamente con RLS.
