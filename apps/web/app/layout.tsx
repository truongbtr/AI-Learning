import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Nunito } from "next/font/google";
import { AppVersion } from "@/components/app-version";
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/art/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    // iOS ignores the manifest entirely; this is the icon the children actually tap (docs/08 pha 8).
    apple: [{ url: "/art/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Góc của con",
    // The kid world's sky is light, so dark text in the status bar is the readable choice.
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // iOS needs this for a standalone app to draw under the rounded corners of an iPad screen.
  viewportFit: "cover",
  themeColor: "#bfe6ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${nunito.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <AppVersion />
      </body>
    </html>
  );
}
