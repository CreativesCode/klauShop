"use client";

import { useToast } from "@/components/ui/use-toast";
import {
  createCartItem,
  findCartItemByOptions,
  updateCartItemQuantity,
} from "@/features/carts/api";
import useCartStore, {
  getProductIdFromCartKey,
} from "@/features/carts/useCartStore";
import useWishlistStore from "@/features/wishlists/useWishlistStore";
import { AuthUser, Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import supabase from "../lib/supabase/client";

type SupabaseAuthContextType = {
  user: AuthUser | null;
  session: Session | null;
  // True until the stored session has been read
  isLoading: boolean;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => {
  const client = useContext(SupabaseAuthContext);
  return client;
};

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

// Guest cart (cookie/localStorage) → carts table, adding to rows with the same variant.
// The guest cart is only cleared once every item was saved.
async function mergeGuestCart(userId: string) {
  const { cart, removeAllProducts } = useCartStore.getState();
  const entries = Object.entries(cart);
  if (!entries.length) return;

  for (const [cartKey, item] of entries) {
    const productId = getProductIdFromCartKey(cartKey);
    const color = item.color ?? null;
    const size = item.size ?? null;
    const material = item.material ?? null;

    const existing = await findCartItemByOptions(
      userId,
      productId,
      color,
      size,
      material,
    );
    if (existing) {
      await updateCartItemQuantity(
        existing.id,
        existing.quantity + item.quantity,
      );
    } else {
      await createCartItem({
        product_id: productId,
        user_id: userId,
        quantity: item.quantity,
        color,
        size,
        material,
      });
    }
  }

  removeAllProducts();
  window.dispatchEvent(new Event("cart-updated"));
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // User id seen on the previous event: SIGNED_IN is re-emitted when the tab regains focus
  const currentUserId = useRef<string | null>(null);
  const mergingFor = useRef<string | null>(null);
  const removeAllCartStorage = useCartStore((s) => s.removeAllProducts);
  const setWishlist = useWishlistStore((s) => s.setWishlist);
  const { toast } = useToast();

  useEffect(() => {
    const syncWishlist = (userId: string) => {
      supabase
        .from("wishlist")
        .select()
        .eq("user_id", userId)
        .then((data) => {
          const wishlistItems = {};

          data?.data?.forEach((item) => {
            wishlistItems[item.product_id] = {
              createdAt: item.created_at,
              updatedAt: item.create_at,
            };
          });

          setWishlist(wishlistItems);
        });
    };

    const syncGuestCart = (userId: string) => {
      if (mergingFor.current === userId) return;
      mergingFor.current = userId;
      mergeGuestCart(userId)
        .catch((error) => {
          console.error("Error merging guest cart:", error);
          toast({
            title: "No pudimos pasar tu carrito a tu cuenta",
            description:
              "Tus productos siguen guardados en este dispositivo. Recarga la página para intentarlo de nuevo.",
            variant: "destructive",
          });
        })
        .finally(() => {
          mergingFor.current = null;
        });
    };

    // Refresh the user from the server, but only drop it on a real auth rejection
    // (a network error on a flaky connection must not log the customer out of the UI)
    const validateUser = () => {
      supabase.auth.getUser().then(({ data, error }) => {
        if (data.user) {
          setUser(data.user);
        } else if (error?.status === 401 || error?.status === 403) {
          currentUserId.current = null;
          setUser(null);
        }
      });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setIsLoading(false);

      if (event === "SIGNED_OUT") {
        currentUserId.current = null;
        setUser(null);
        removeAllCartStorage();
        return;
      }

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      // No session: nothing to validate (avoids a useless 403 for guests)
      if (!sessionUser) return;
      validateUser();

      const previousId = currentUserId.current;
      currentUserId.current = sessionUser.id;
      if (previousId === sessionUser.id) return;

      // A user appeared (login, OAuth return, or a page load with a session)
      syncGuestCart(sessionUser.id);
      syncWishlist(sessionUser.id);

      if (event === "SIGNED_IN" && previousId === null) {
        toast({
          title: "¡Bienvenido de nuevo!",
          description: "Ya estás autenticado.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseAuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
