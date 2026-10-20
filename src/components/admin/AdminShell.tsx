import Link from "next/link";
import { ReactNode } from "react";
import { Icons } from "../layouts/icons";

type Crumb = { label: string; href?: string };

type AdminShellProps = {
  heading: ReactNode;
  description?: ReactNode;
  /** Right side of the heading (primary action last) */
  actions?: ReactNode;
  /** Detail pages: back button + "Órdenes / KS-1058" */
  breadcrumb?: Crumb[];
  /** @deprecated use breadcrumb (kept for pages that only need "back") */
  showBackButton?: boolean;
  children: ReactNode;
};

/** Admin page header (H1 + description + actions) followed by the page body. */
function AdminShell({
  heading,
  description,
  actions,
  breadcrumb,
  showBackButton,
  children,
}: AdminShellProps) {
  const backHref = breadcrumb?.find((c) => c.href)?.href;

  return (
    <section className="flex min-w-0 flex-col gap-4 lg:gap-6">
      {(breadcrumb?.length || showBackButton) && (
        <div className="flex items-center gap-3 text-[13px] font-semibold text-neutral-500">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Volver"
              className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-[#E7E4EF] bg-white text-ink hover:bg-primary-50"
            >
              <Icons.arrowLeft className="size-5" aria-hidden />
            </Link>
          )}
          {breadcrumb && (
            <nav
              aria-label="Ruta"
              className="flex min-w-0 items-center gap-1.5"
            >
              {breadcrumb.map((c, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && <span aria-hidden>/</span>}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-primary-700">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate text-ink">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[clamp(24px,2.4vw,32px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
            {heading}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-neutral-500">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {children}
    </section>
  );
}

export default AdminShell;
