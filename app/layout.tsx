import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import Providers from "@/components/Providers";

const font = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Techwitpro Work Library", template: "%s · Techwitpro" },
  description: "Techwitpro portfolio: branding, UI/UX, web, mobile, menus, video and marketing work.",
};

export const viewport: Viewport = { themeColor: "#04132F" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
