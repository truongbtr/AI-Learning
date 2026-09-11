import { PageHeader } from "@/components/admin/page-header";
import { listSkills, loadSkillTree } from "@/lib/admin/skills";
import { guardPage } from "@/lib/auth/session";
import { SkillsAdmin } from "./skills-admin";

export const dynamic = "force-dynamic";

/** FR-CORE-03: skill tree per subject/strand, search, edit, hide, JSON/CSV import. */
export default async function AdminSkillsPage() {
  await guardPage("admin");
  const tree = await loadSkillTree();
  const first = tree.subjects[0]?.subject ?? null;
  const items = await listSkills({ subject: first, limit: 200 });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nội dung", "Bản đồ kỹ năng"]}
        title="Bản đồ kỹ năng"
        description="Cây kỹ năng theo môn và mạch. Sửa tên, mô tả, tiên quyết; ẩn kỹ năng không dùng; nạp thêm từ JSON/CSV. Kỹ năng đã có bằng chứng của con chỉ được ẩn, không xoá."
      />
      <SkillsAdmin tree={tree} initialSubject={first} initialItems={items} />
    </div>
  );
}
