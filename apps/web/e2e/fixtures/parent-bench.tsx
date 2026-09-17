/**
 * A test page for one parent-area component, bundled by the e2e with esbuild.
 *
 * The parent pages need an adult login, and this session has no password for one, so the only way
 * to see and click the card is to mount the real component with props of our own.
 */
import { createRoot } from "react-dom/client";
import { LessonPicker, type PickerSubject } from "@/app/(parent)/parent/diary/lesson-picker";

declare global {
  interface Window {
    __PARENT_BENCH__?: { subjects: PickerSubject[]; className: string };
    __SENT__?: { url: string; body: unknown }[];
  }
}

const root = document.getElementById("bench-root");
const props = window.__PARENT_BENCH__;
if (root && props)
  createRoot(root).render(
    <div className="min-h-screen bg-[#F6F3EC] p-8">
      <LessonPicker subjects={props.subjects} className={props.className} />
    </div>,
  );
