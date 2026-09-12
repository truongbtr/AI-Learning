import type { Viewport } from "next";
import { guardPage } from "@/lib/auth/session";

/**
 * Zoom is off in the child's area and only there (docs/08 pha 8 việc 1). A six-year-old resting a
 * palm on an iPad while she thinks will pinch the quest out of shape and have no idea how to get
 * it back — and the layout is already sized for her, so there is nothing to zoom towards. The
 * parent's dashboard keeps pinch-zoom: an adult reading an evidence page on a phone needs it.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/** Kid area: only CHILD (ADMIN in preview mode). Checked again here besides proxy.ts. */
export default async function KidLayout({ children }: { children: React.ReactNode }) {
  await guardPage("kid");
  return <div className="kid-world text-slate-800">{children}</div>;
}
