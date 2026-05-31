import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "CreatorsLink",
  description: "Run your entire creator-partnership business in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(display.variable, body.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen bg-[var(--cl-paper)] text-[var(--cl-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
