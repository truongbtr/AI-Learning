import { PageHeader } from "@/components/admin/page-header";
import { guardPage } from "@/lib/auth/session";
import { DevKit } from "./dev-kit";

export const dynamic = "force-dynamic";

/**
 * /dev/kit (docs/06 §4, docs/08 pha 2 item 3): paste any ExerciseSpec and see it rendered the way
 * the child will. Phase 3 grows this page into the full component gallery.
 */
export default async function DevKitPage() {
  await guardPage("admin");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nội dung", "Bộ dựng bài"]}
        title="Bộ dựng bài (/dev/kit)"
        description="Dán một ExerciseSpec bất kỳ vào đây để xem con sẽ thấy gì. Dùng khi soạn nội dung mới hoặc khi sửa một bài trong content/exercises/."
      />
      <DevKit />
    </div>
  );
}
