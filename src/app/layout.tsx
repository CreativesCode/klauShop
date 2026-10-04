import { Toaster } from "@/components/ui/toaster";
import { getPageMetadata } from "@/config/site";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import CustomProvider from "../providers/CustomProvider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = getPageMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={sora.variable}>
      <CustomProvider>
        <body className={sora.className}>
          {children}
          <Toaster />
        </body>
      </CustomProvider>
    </html>
  );
}
