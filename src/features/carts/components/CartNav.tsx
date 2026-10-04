"use client";
import { useAuth } from "@/providers/AuthProvider";
import { User } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo } from "react";
import { create } from "zustand";
import useCartStore, { calcProductCountStorage } from "../useCartStore";
import CartLink from "./CartLink";

function CartNav() {
  const { user } = useAuth();
  return <>{!user ? <GuestCart /> : <UserCartNav currentUser={user} />}</>;
}

const GuestCart = () => {
  const cart = useCartStore((s) => s.cart);

  const productCountStorage = useMemo(
    () => calcProductCountStorage(cart),
    [cart],
  );
  return <CartLink productCount={productCountStorage} />;
};

// Shared by the desktop and mobile navbars (both mounted): one request per change
const useUserCartCount = create<{ userId: string | null; count: number }>(
  () => ({ userId: null, count: 0 }),
);
let inflight: Promise<void> | null = null;
// A change during a request must trigger one more read (the in-flight one may be stale)
let rerun = false;

function refreshUserCartCount(userId: string): Promise<void> {
  if (inflight) {
    rerun = true;
    return inflight;
  }
  {
    inflight = (async () => {
      try {
        const { data, error } = await createClient()
          .from("carts")
          .select("quantity")
          .eq("user_id", userId);
        if (error) throw error;
        const count = (data ?? []).reduce(
          (acc, item) => acc + (item.quantity || 0),
          0,
        );
        useUserCartCount.setState({ userId, count });
      } catch (error) {
        console.error("Error loading cart count:", error);
      } finally {
        inflight = null;
        if (rerun) {
          rerun = false;
          refreshUserCartCount(userId);
        }
      }
    })();
  }
  return inflight;
}

const UserCartNav = ({ currentUser }: { currentUser: User }) => {
  const { userId, count } = useUserCartCount();

  useEffect(() => {
    refreshUserCartCount(currentUser.id);

    // Escuchar evento de actualización del carrito
    const handleCartUpdate = () => refreshUserCartCount(currentUser.id);
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [currentUser.id]);

  // Another account's count (or none yet) shows as empty
  return <CartLink productCount={userId === currentUser.id ? count : 0} />;
};

export default CartNav;
