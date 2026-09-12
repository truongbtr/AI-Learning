"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Xuất PDF" (FR-PAR-02) through the browser's own print dialog, which offers *Save as PDF* on
 * Windows, macOS, Android and iOS alike.
 *
 * The alternative — a PDF library on the server — would add a headless-browser dependency to a
 * machine that already runs Postgres, a worker and Next on a home connection, to produce a worse
 * document than the one the browser makes from the same CSS. The print stylesheet in
 * `globals.css` hides the shell and lets the map fill the page. Written down in the phase report
 * as a small departure from a literal reading of "xuất PDF".
 */
export function PrintButton({ label = "Xuất PDF" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" /> {label}
    </Button>
  );
}
