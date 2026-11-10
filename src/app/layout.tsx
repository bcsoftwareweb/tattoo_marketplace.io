import type { Metadata } from "next";
import { Inter, Space_Grotesk, Syne } from "next/font/google";
import { DemoProvider } from "@/context/demo-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });

export const metadata: Metadata = {
  title: { default: "BLACKLINE", template: "%s · BLACKLINE" },
  description: "A frontend demo of a curated New York tattoo artist marketplace. Accounts, messages, and payments are simulated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${space.variable} ${syne.variable} h-full`}>
      <body className="min-h-full antialiased">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
