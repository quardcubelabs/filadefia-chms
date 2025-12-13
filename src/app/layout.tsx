import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FCC Church Management System",
  description: "Filadefia Christian Center - Tanzania Assemblies of God (TAG) Church Management System",
  keywords: "church, management, system, Tanzania, Assemblies of God, FCC, Filadefia",
  authors: [{ name: "FCC IT Department" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} antialiased h-full bg-gray-50`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
