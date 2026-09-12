import type { MetadataRoute } from "next";

/**
 * The installable app (docs/08 pha 8 việc 1): tapped from the iPad home screen it opens full
 * screen, with no address bar for a six-year-old to wander out of.
 *
 * `start_url` is `/`, not `/kid/home`. A child whose two-hour session is still alive lands
 * straight in her own world; one whose session expired lands on the four-picture login and gets
 * there in three taps. Pointing it at `/kid/home` would have made the expired case a redirect
 * through a page she cannot read.
 *
 * `display: standalone` rather than `fullscreen`: on iPadOS the two behave the same for a
 * home-screen app, and on Android `standalone` keeps the status bar, which is how a parent sees
 * the time and the battery while sitting next to her.
 *
 * The manifest is served at `/manifest.webmanifest` and is allowed through `proxy.ts` without a
 * session — iOS fetches it before anyone has logged in.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Học cùng Mai Thy & Chí Thanh",
    short_name: "Góc của con",
    description: "Góc học ở nhà của hai bé lớp 1.",
    lang: "vi",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FFE3B0",
    theme_color: "#FFC46B",
    categories: ["education", "kids"],
    icons: [
      { src: "/art/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/art/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/art/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Long-press the icon: the two places worth going straight to. The parent's shortcut is
    // behind Cloudflare Access like the rest of `/parent`, which is the point.
    shortcuts: [
      {
        name: "Nhiệm vụ hôm nay",
        short_name: "Học ngay",
        url: "/kid/quest",
        icons: [{ src: "/art/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Bảng của ba mẹ",
        short_name: "Ba mẹ",
        url: "/parent",
        icons: [{ src: "/art/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
