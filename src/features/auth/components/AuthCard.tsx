import Branding from "@/components/layouts/Branding";
import * as React from "react";

type AuthCardProps = {
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

/** Centered card shared by sign-in, sign-up and password reset. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-[420px] rounded-[28px] border border-line bg-white p-6 sm:p-8">
      <header className="mb-6 flex flex-col items-center gap-4 text-center">
        <Branding height={44} />
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-neutral-500">{description}</p>
          )}
        </div>
      </header>
      {children}
      {footer && (
        <footer className="mt-6 flex flex-col items-center gap-3 border-t border-line-soft pt-5 text-center text-sm text-neutral-500">
          {footer}
        </footer>
      )}
    </section>
  );
}

export default AuthCard;
