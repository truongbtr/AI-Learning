import { prisma } from "@mtct/db";
import { WorldBackground } from "@/components/kid/world-background";
import { AdultLoginForm } from "./adult-login-form";
import { type KidCard, KidLogin } from "./kid-login";

export const dynamic = "force-dynamic";

/** One combined /login page (docs/12 §4): kid avatar cards on top, adult form below. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; changed?: string }>;
}) {
  const params = await searchParams;
  const kids: KidCard[] = await prisma.user.findMany({
    where: { role: "CHILD", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, avatarKey: true, pictureSetKey: true },
  });

  return (
    <WorldBackground theme="garden">
      <main className="flex min-h-dvh flex-col items-center px-4 py-8">
        <h1 className="mb-6 text-center text-4xl font-black text-sky-800 drop-shadow-sm">
          Học cùng Mai Thy &amp; Chí Thanh
        </h1>

        <KidLogin kids={kids} />

        <div className="mt-10 w-full max-w-md">
          <div className="mb-3 flex items-center gap-3 text-sm text-slate-600">
            <span className="h-px flex-1 bg-slate-400/50" />
            Ba mẹ đăng nhập
            <span className="h-px flex-1 bg-slate-400/50" />
          </div>
          <div className="rounded-xl border bg-white/95 p-5 shadow font-sans">
            {params.changed ? (
              <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Đã đổi mật khẩu. Đăng nhập lại nhé.
              </p>
            ) : null}
            <AdultLoginForm next={params.next ?? null} />
          </div>
        </div>
      </main>
    </WorldBackground>
  );
}
