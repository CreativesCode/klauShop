"use client";
import { useAuth } from "@/providers/AuthProvider";
import UserCartSection from "./UserCartSection";

import GuestCartSection from "./GuestCartSection";
import type { CartSectionProps } from "./CartLayout";

function CartSection(props: CartSectionProps) {
  const { user } = useAuth();

  return (
    <>
      {user ? (
        <UserCartSection user={user} {...props} />
      ) : (
        <GuestCartSection {...props} />
      )}
    </>
  );
}

export default CartSection;
