import { Toaster } from "@/components/ui/toaster";
import { getPageMetadata } from "@/config/site";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import CustomProvider from "../providers/CustomProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = getPageMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CustomProvider>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </CustomProvider>
    </html>
  );
}
