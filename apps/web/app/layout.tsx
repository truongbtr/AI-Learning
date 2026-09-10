import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Nunito } from "next/font/google";
import "./globals.css";

// Self-hosted at build time via next/font (docs/08 pha 0).
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Học cùng Mai Thy & Chí Thanh",
  description: "Nền tảng học tại nhà của gia đình",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#bfe6ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${nunito.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
