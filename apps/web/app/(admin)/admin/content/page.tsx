import { PageHeader } from "@/components/admin/page-header";
import { contentCoverage, listBatches, listExercises } from "@/lib/admin/content";
import { guardPage } from "@/lib/auth/session";
import { ContentAdmin } from "./content-admin";

export const dynamic = "force-dynamic";

/** FR-ADM-05: content batches, preview exactly as the child sees it, GOOD/BAD flags, publish. */
export default async function AdminContentPage() {
  await guardPage("admin");
  const batches = await listBatches();
  const [items, coverage] = await Promise.all([
    listExercises({ batchId: batches[0]?.id ?? null }),
    contentCoverage(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nội dung", "Ngân hàng bài"]}
        title="Ngân hàng bài"
        description="Duyệt từng lô nội dung do Claude Code soạn: xem thử bài đúng như con sẽ thấy, gắn cờ bài xấu, rồi phát hành. Bài chưa phát hành không bao giờ vào phiên học của con."
      />
      <ContentAdmin
        initialBatches={batches}
        initialItems={items}
        coverage={coverage.skills.map((s) => ({
          code: s.code,
          nameVi: s.nameVi,
          subject: s.subject,
          published: s.published,
          draft: s.draft,
          missingTypes: s.missingTypes,
          missingDifficulties: s.missingDifficulties,
        }))}
      />
    </div>
  );
}
