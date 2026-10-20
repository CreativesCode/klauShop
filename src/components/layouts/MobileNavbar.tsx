import CartLink from "@/features/carts/components/CartLink";
import CartNav from "@/features/carts/components/CartNav";
import { Suspense } from "react";
import Branding from "./Branding";
import MobileNavStart from "./MobileNavStart";
import MobileSearchInput from "./MobileSearchInput";
import SideMenuServer from "./SideMenuServer";

/** Mobile header: menu · centered logo · cart, then an always-visible search row. */
async function MobileNavbar() {
  return (
    <div className="md:hidden">
      <div className="grid grid-cols-[44px_1fr_44px] items-center px-3 py-2">
        <MobileNavStart menu={<SideMenuServer />} />
        <div className="flex justify-center">
          <Branding height={40} />
        </div>
        <Suspense fallback={<CartLink productCount={0} variant="icon" />}>
          <CartNav variant="icon" />
        </Suspense>
      </div>
      <div className="px-4 pb-3">
        <Suspense>
          <MobileSearchInput />
        </Suspense>
      </div>
    </div>
  );
}

export default MobileNavbar;
