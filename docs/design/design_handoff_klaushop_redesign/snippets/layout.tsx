// src/app/layout.tsx — reemplaza Sora por Manrope + Instrument Serif
import { Toaster } from "@/components/ui/toaster";
import { getPageMetadata } from "@/config/site";
import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import CustomProvider from "../providers/CustomProvider";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Solo títulos editoriales de la tienda (hero, banners, encargos). Nunca en el admin.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = getPageMetadata();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable}`}>
      <CustomProvider>
        <body className="font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </CustomProvider>
    </html>
  );
}
