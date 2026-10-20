import { UserNav } from "@/features/auth";
import { CartLink, CartNav } from "@/features/carts";
import { WishlistNavLink } from "@/features/wishlists";
import { Suspense } from "react";
import Branding from "./Branding";
import CategoriesSubNav from "./CategoriesSubNav";
import MobileNavbar from "./MobileNavbar";
import SearchInput from "./SearchInput";

/** Sticky store header: desktop (logo · search · actions + categories row) and mobile. */
async function MainNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line-header bg-white/85 backdrop-blur-[14px] backdrop-saturate-[1.8]">
      <div className="mx-auto hidden max-w-store px-4 md:block md:px-6 xl:px-8">
        <div className="flex items-center gap-8 py-3.5">
          <Branding height={44} />

          <div className="flex flex-1 justify-center">
            <Suspense>
              <SearchInput />
            </Suspense>
          </div>

          <div className="flex items-center gap-1.5">
            <Suspense>
              <UserNav />
            </Suspense>
            <WishlistNavLink />
            <Suspense fallback={<CartLink productCount={0} />}>
              <CartNav />
            </Suspense>
          </div>
        </div>
        <Suspense>
          <CategoriesSubNav />
        </Suspense>
      </div>

      <MobileNavbar />
    </header>
  );
}

export default MainNavbar;
