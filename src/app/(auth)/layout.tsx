"use client";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-dvh bg-cream">
      <main className="flex min-h-dvh items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
