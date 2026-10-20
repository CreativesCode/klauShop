import type { SidebarNavItem } from "@/types";

export type SidebarNavGroup = {
  title: string;
  items: SidebarNavItem[];
};

export type DashboardConfig = {
  sidebarGroups: SidebarNavGroup[];
  sidebarNav: SidebarNavItem[];
};

const sidebarGroups: SidebarNavGroup[] = [
  {
    title: "General",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: "layoutDashboard",
        items: [],
      },
      { title: "Órdenes", href: "/admin/orders", icon: "receipt", items: [] },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { title: "Productos", href: "/admin/products", icon: "cart", items: [] },
      {
        title: "Colecciones",
        href: "/admin/collections",
        icon: "folder",
        items: [],
      },
      { title: "Multimedia", href: "/admin/medias", icon: "image", items: [] },
    ],
  },
  {
    title: "Clientes y envíos",
    items: [
      { title: "Usuarios", href: "/admin/users", icon: "user", items: [] },
      {
        title: "Zonas de envío",
        href: "/admin/shipping-zones",
        icon: "truck",
        items: [],
      },
    ],
  },
];

export const dashboardConfig: DashboardConfig = {
  sidebarGroups,
  // Flat list (store side menu for admins)
  sidebarNav: sidebarGroups.flatMap((g) => g.items),
};
