import UserNav from "@/features/auth/components/UserNav";
import { Suspense } from "react";
import CartLink from "../../features/carts/components/CartLink";
import CartNav from "../../features/carts/components/CartNav";
import Branding from "./Branding";
import MobileSearchInput from "./MobileSearchInput";
import SideMenuServer from "./SideMenuServer";

type Props = { adminLayout: boolean };

async function MobileNavbar({ adminLayout }: Props) {
  return (
    <div className="md:hidden flex gap-x-8 justify-between items-center">
      <div className="flex gap-x-3 items-center">
        <SideMenuServer />
        <MobileSearchInput />
      </div>

      <Branding />
      <div className="flex gap-x-2 items-center">
        <Suspense>
          <UserNav />
        </Suspense>
        <Suspense fallback={<CartLink productCount={0} />}>
          {!adminLayout && <CartNav />}
        </Suspense>
      </div>
    </div>
  );
}

export default MobileNavbar;
