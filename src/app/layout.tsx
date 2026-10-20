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
