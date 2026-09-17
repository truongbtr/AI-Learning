/**
 * A test page for one exercise, bundled by the pha-13 e2e with esbuild and loaded on the dev server.
 *
 * The admin bench (/dev/kit) needs an admin login and a real session hands out whatever the planner
 * picks, so neither can show *this* ten-frame question on demand. This renders the very same
 * `ExerciseRenderer` the child uses, inside the same `FitToHeight` box as the city panel, with the
 * app's own stylesheet — for screenshots and for measuring the tap targets at 1280 × 720 and iPad.
 *
 * The spec comes from `window.__BENCH__`, built by the test with `toExerciseSpec` (no answer key).
 */
import { createRoot } from "react-dom/client";
import { ExerciseRenderer } from "@/components/kid/exercise";
import type { ClientSpec } from "@/components/kid/exercise/types";
import { FitToHeight } from "@/components/kid/fit-to-height";

declare global {
  interface Window {
    __BENCH__?: { spec: ClientSpec };
    __BENCH_SENT__?: unknown[];
  }
}

function Bench({ spec }: { spec: ClientSpec }) {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-gradient-to-b from-[#CDEBFF] to-[#FFF6E5]"
      data-testid="bench"
    >
      <div className="relative m-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[40px] bg-[#FFF9EE]/95 p-4 shadow-xl">
        <FitToHeight>
          <ExerciseRenderer
            spec={spec}
            vars={{ ten: "Chí Thanh", vat: "bánh răng", ban: "Robot" }}
            mascot="robot"
            disabled={false}
            onHint={() => {}}
            onSubmit={(response) => {
              window.__BENCH_SENT__ = [...(window.__BENCH_SENT__ ?? []), response];
            }}
          />
        </FitToHeight>
      </div>
    </div>
  );
}

const root = document.getElementById("bench-root");
if (root && window.__BENCH__) createRoot(root).render(<Bench spec={window.__BENCH__.spec} />);
