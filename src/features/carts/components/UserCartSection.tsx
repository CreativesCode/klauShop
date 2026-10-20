"use client";
import { useToast } from "@/components/ui/use-toast";
import CartItemCard from "@/features/carts/components/CartItemCard";
import { CartLayout, CartSectionProps, CartSkeleton } from "./CartLayout";
import EmptyCart from "@/features/carts/components/EmptyCart";
import { getDiscountedUnitPrice } from "@/features/orders/utils/pricing";
import { WhatsAppCheckoutButton } from "@/features/orders";
import { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import {
  checkAvailableStock,
  deleteCartItem,
  getCartItems,
  updateCartItemQuantity,
} from "../api";
import { CartItems } from "../useCartStore";

type UserCartSectionProps = CartSectionProps & { user: User };

type CartItemWithProduct = {
  id: string;
  product_id: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    discount?: number | null;
    description: string;
    featuredImage: {
      id: string;
      key: string;
      alt: string;
    };
  };
};

function UserCartSection({
  user,
  variant = "page",
  autoOpenCheckout = false,
}: UserCartSectionProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItemWithProduct[]>([]);
  const [fetching, setFetching] = useState(true);

  // The skeleton only shows on the first load; +/- refresh in place
  const loadCart = async () => {
    try {
      const items = await getCartItems(user.id);
      setCart(items as any);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({
        title: "No se pudo cargar el carrito",
        description: "Revisa tu conexión y recarga la página.",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadCart();

    // Escuchar evento de actualización del carrito
    const handleCartUpdate = () => loadCart();
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [user.id]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      // Same per-unit rounding as the server (order_lines.price)
      const discountedPrice = getDiscountedUnitPrice(
        item.product?.price,
        item.product?.discount,
      );
      return acc + item.quantity * discountedPrice;
    }, 0);
  }, [cart]);

  const productCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  if (fetching) {
    return <CartSkeleton variant={variant} />;
  }

  const addOneHandler = async (
    cartItemId: string,
    quantity: number,
    productId: string,
    color?: string | null,
    size?: string | null,
    material?: string | null,
  ) => {
    setIsLoading(true);
    try {
      // Verificar stock disponible antes de incrementar
      const stockCheck = await checkAvailableStock(
        productId,
        quantity + 1,
        color,
        size,
        material,
      );

      if (!stockCheck.hasStock) {
        toast({
          title: "Stock Insuficiente",
          description: `Solo hay ${stockCheck.availableStock} unidades disponibles.`,
          variant: "destructive",
        });
        return;
      }

      if (quantity < 8) {
        await updateCartItemQuantity(cartItemId, quantity + 1);
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        toast({ title: "Has alcanzado el máximo por producto." });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const minusOneHandler = async (cartItemId: string, quantity: number) => {
    if (quantity > 1) {
      setIsLoading(true);
      try {
        await updateCartItemQuantity(cartItemId, quantity - 1);
        window.dispatchEvent(new Event("cart-updated"));
      } catch (error) {
        toast({
          title: "No se pudo cambiar la cantidad",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({ title: "La cantidad mínima es 1." });
    }
  };

  const removeHandler = async (cartItemId: string) => {
    setIsLoading(true);
    try {
      await deleteCartItem(cartItemId);
      window.dispatchEvent(new Event("cart-updated"));
      toast({ title: "Producto eliminado." });
    } catch (error) {
      toast({
        title: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {cart && cart.length > 0 ? (
        <CartLayout
          variant={variant}
          productCount={productCount}
          subtotal={subtotal}
          checkout={
            <WhatsAppCheckoutButton
              cartItems={cart.map((item) => ({
                productId: item.product_id,
                quantity: item.quantity,
                color: item.color,
                size: item.size,
                material: item.material,
              }))}
              subtotal={subtotal}
              disabled={isLoading}
              defaultOpen={autoOpenCheckout}
              className="w-full"
            />
          }
        >
          {cart.map((item) => (
            <CartItemCard
              key={item.id}
              id={item.id}
              product={item.product}
              quantity={item.quantity}
              selectedColor={item.color}
              selectedSize={item.size}
              selectedMaterial={item.material}
              addOneHandler={() =>
                addOneHandler(
                  item.id,
                  item.quantity,
                  item.product_id,
                  item.color,
                  item.size,
                  item.material,
                )
              }
              minusOneHandler={() => minusOneHandler(item.id, item.quantity)}
              removeHandler={() => removeHandler(item.id)}
              disabled={isLoading}
            />
          ))}
        </CartLayout>
      ) : (
        <EmptyCart variant={variant} />
      )}
    </>
  );
}

export default UserCartSection;
