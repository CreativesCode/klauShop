"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import CartItemCard from "@/features/carts/components/CartItemCard";
import EmptyCart from "@/features/carts/components/EmptyCart";
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
import CheckoutButton from "./CheckoutButton";

type UserCartSectionProps = { user: User };

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

function UserCartSection({ user }: UserCartSectionProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItemWithProduct[]>([]);
  const [fetching, setFetching] = useState(true);

  const loadCart = async () => {
    try {
      setFetching(true);
      const items = await getCartItems(user.id);
      setCart(items as any);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({ title: "Error loading cart" });
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
      const price = Number(item.product?.price || 0);
      const discount = Number(item.product?.discount || 0);
      const discountedPrice =
        discount > 0 ? price - (price * discount) / 100 : price;
      return acc + item.quantity * discountedPrice;
    }, 0);
  }, [cart]);

  const productCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  if (fetching) {
    return <LoadingCartSection />;
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
        await loadCart();
      } else {
        toast({ title: "Product Limit is reached." });
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
        await loadCart();
      } catch (error) {
        toast({ title: "Error updating quantity" });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({ title: "Minimum is reached." });
    }
  };

  const removeHandler = async (cartItemId: string) => {
    setIsLoading(true);
    try {
      await deleteCartItem(cartItemId);
      await loadCart();
      toast({ title: "Removed a Product." });
    } catch (error) {
      toast({ title: "Error removing product" });
    } finally {
      setIsLoading(false);
    }
  };

  const createCartObject = (): CartItems => {
    const cartObj: CartItems = {};
    cart.forEach((item) => {
      if (item.product) {
        // Usar una clave única que incluya las opciones
        const key = `${item.product.id}-${item.color || "none"}-${item.size || "none"}-${item.material || "none"}`;
        cartObj[key] = {
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          material: item.material,
        };
      }
    });
    return cartObj;
  };

  return (
    <>
      {cart && cart.length > 0 ? (
        <section
          aria-label="Cart Section"
          className="grid grid-cols-12 gap-x-6 gap-y-5"
        >
          <div className="col-span-12 md:col-span-9 overflow-y-auto space-y-3">
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
          </div>

          <Card className="w-full h-[180px] px-3 col-span-12 md:col-span-3">
            <CardHeader className="px-3 pt-2 pb-0 text-md">
              <CardTitle className="text-lg mb-0">Subtotoal: </CardTitle>
              <CardDescription>{`${productCount} Items`}</CardDescription>
            </CardHeader>
            <CardContent className="relative overflow-hidden px-3 py-2">
              <p className="text-3xl md:text-lg lg:text-2xl font-bold">{`$ ${subtotal.toFixed(2).toString()}`}</p>
            </CardContent>

            <CardFooter className="gap-x-2 md:gap-x-5 px-3 flex-col gap-y-3">
              <WhatsAppCheckoutButton
                cartItems={cart.map((item) => ({
                  productId: item.product_id,
                  quantity: item.quantity,
                  color: item.color,
                  size: item.size,
                  material: item.material,
                }))}
                disabled={isLoading}
                className="w-full"
              />
              <CheckoutButton
                guest={false}
                disabled={isLoading}
                order={createCartObject()}
              />
            </CardFooter>
          </Card>
        </section>
      ) : (
        <EmptyCart />
      )}
    </>
  );
}

export default UserCartSection;

const LoadingCartSection = () => (
  <section
    className="grid grid-cols-12 gap-x-6 gap-y-5"
    aria-label="Loading Skeleton"
  >
    <div className="col-span-12 md:col-span-9 space-y-8">
      {[...Array(4)].map((_, index) => (
        <div
          className="flex items-center justify-between gap-x-6 gap-y-8 border-b p-5"
          key={index}
        >
          <Skeleton className="h-[120px] w-[120px]" />
          <div className="space-y-3 w-full">
            <Skeleton className="h-6 max-w-xs" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>
      ))}
    </div>
    <div className="w-full h-[180px] px-3 col-span-12 md:col-span-3 border p-5">
      <div className="space-y-3 w-full">
        <Skeleton className="h-6 max-w-xs" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4 mb-6" />
        <Skeleton className="h-4 mb-6 max-w-[280px]" />
      </div>
    </div>
  </section>
);
