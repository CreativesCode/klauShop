import { UserNav } from "@/features/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { CartLink, CartNav } from "../../features/carts";
import Branding from "./Branding";
import MobileNavbar from "./MobileNavbar";
import SearchInput from "./SearchInput";
import SideMenuServer from "./SideMenuServer";
import { Icons } from "./icons";

interface MainNavbarProps {
  adminLayout?: boolean;
}

async function MainNavbar({ adminLayout = false }: MainNavbarProps) {
  return (
    <nav className="bg-primary-50 border-b border-primary-300 fixed z-50 w-full">
      <div
        className={cn(
          adminLayout
            ? "mx-auto container"
            : "max-w-screen-2xl mx-auto container",
        )}
      >
        <div className="hidden md:flex gap-x-8 justify-between items-center">
          {/* Menu & branding */}
          <div className="flex gap-x-3 items-center">
            <SideMenuServer />
            <Branding />
          </div>

          {adminLayout ? (
            <></>
          ) : (
            <Suspense>
              <SearchInput />
            </Suspense>
          )}

          {/* Nav Action */}
          <div className="flex gap-x-5 relative items-center">
            <Suspense>
              <UserNav />
            </Suspense>

            {!adminLayout && (
              <Link href={"/wish-list"}>
                <Icons.heart
                  className="w-5 h-5 text-primary"
                  aria-label="wishlist"
                />
              </Link>
            )}

            <Suspense fallback={<CartLink productCount={0} />}>
              {!adminLayout && <CartNav />}
            </Suspense>
          </div>
        </div>

        <MobileNavbar adminLayout={adminLayout} />
      </div>
    </nav>
  );
}

export default MainNavbar;
