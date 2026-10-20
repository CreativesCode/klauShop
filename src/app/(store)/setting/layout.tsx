import { SettingSidebarNav } from "@/components/layouts/SettingSidebar";
import { Shell } from "@/components/layouts/Shell";
import { getPageMetadata } from "@/config/site";

export const metadata = getPageMetadata(
  "Configuraciones",
  "Gestiona tus configuraciones y preferencias de usuario.",
);

const sidebarNavItems = [
  {
    title: "Perfil",
    href: "/setting",
  },
  {
    title: "Cuenta",
    href: "/setting/account",
  },
  {
    title: "Direcciones",
    href: "/setting/address",
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <Shell>
      <header className="flex flex-col gap-1">
        <h1 className="text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-0.02em] text-ink">
          Mi cuenta
        </h1>
        <p className="text-[15px] text-neutral-500">
          Gestiona tu perfil, tu cuenta y tus direcciones.
        </p>
      </header>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="lg:w-56 lg:shrink-0">
          <SettingSidebarNav items={sidebarNavItems} />
        </aside>
        <div className="min-h-[30vh] min-w-0 flex-1">{children}</div>
      </div>
    </Shell>
  );
}
