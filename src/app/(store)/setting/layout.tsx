import { SettingSidebarNav } from "@/components/layouts/SettingSidebar";
import { Separator } from "@/components/ui/separator";
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
    <>
      <div className="space-y-6 p-10 pb-16 max-w-screen-2xl mx-auto">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Configuraciones</h2>
          <p className="text-muted-foreground">
            Gestiona tus configuraciones y preferencias de usuario.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SettingSidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 min-h-[30vh]">{children}</div>
        </div>
      </div>
    </>
  );
}
