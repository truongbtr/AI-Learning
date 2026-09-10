import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <Link href="/" className="text-primary underline">
        Về trang chính
      </Link>
    </main>
  );
}
