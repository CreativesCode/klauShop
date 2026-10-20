import MainFooter from "@/components/layouts/MainFooter";
import Navbar from "@/components/layouts/MainNavbar";
import { MobileTabBar } from "@/components/layouts/MobileTabBar";
import { ServiceWorkerRegister } from "@/components/layouts/ServiceWorkerRegister";
import { siteConfig } from "@/config/site";
import { CartDrawer } from "@/features/carts";
import { ReactNode } from "react";

type Props = { children: ReactNode };

async function StoreLayout({ children }: Props) {
  return (
    // Room for the mobile tab bar / fixed buy bars so they never cover content
    <div className="pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="bg-primary-950 px-4 py-[9px] text-center text-[13px] font-medium text-primary-100">
        <span
          className="mr-2 inline-block size-1.5 rounded-full bg-accent align-middle"
          aria-hidden
        />
        Envíos a domicilio en {siteConfig.zones}
      </div>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <MainFooter />
      <MobileTabBar />
      <CartDrawer />
      {/* Store only: the admin never works offline */}
      <ServiceWorkerRegister />
    </div>
  );
}

export default StoreLayout;
