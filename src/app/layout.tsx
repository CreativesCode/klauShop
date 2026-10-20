import { Toaster } from "@/components/ui/toaster";
import { getPageMetadata } from "@/config/site";
import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import CustomProvider from "../providers/CustomProvider";
import "./globals.css";

// One static file per weight: Google only serves Manrope as a variable font, and
// browsers without variable-font support (old iOS) would render it all ExtraLight
const sans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/manrope/files/manrope-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/manrope/files/manrope-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/manrope/files/manrope-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/manrope/files/manrope-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Editorial store headings only (hero, banners, special orders). Never in the admin.
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
}: Readonly<{
  children: React.ReactNode;
}>) {
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
