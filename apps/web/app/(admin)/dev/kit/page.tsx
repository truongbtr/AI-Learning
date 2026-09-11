import { PageHeader } from "@/components/admin/page-header";
import { guardPage } from "@/lib/auth/session";
import { DevKit } from "./dev-kit";
import { KitGallery } from "./kit-gallery";

export const dynamic = "force-dynamic";

/**
 * /dev/kit (docs/06 §4, docs/08 pha 2 item 3 and pha 3 item 2).
 *
 * Two halves: the component gallery — every kid component and all nine mascot states, so a change
 * can be seen without walking a child through a session — and the exercise bench, where any
 * ExerciseSpec can be pasted in and looked at exactly as the child will see it.
 */
export default async function DevKitPage() {
  await guardPage("admin");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nội dung", "Bộ dựng giao diện"]}
        title="Bộ dựng giao diện (/dev/kit)"
        description="Trên: mọi component của Góc con và 9 trạng thái mascot. Dưới: dán một ExerciseSpec để xem con sẽ thấy gì."
      />
      <KitGallery />
      <DevKit />
    </div>
  );
}
