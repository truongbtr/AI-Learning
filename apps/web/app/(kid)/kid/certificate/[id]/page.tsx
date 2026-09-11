import { prisma } from "@mtct/db";
import { notFound } from "next/navigation";
import { requireStudentAccess } from "@/lib/auth/session";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

const MONTHS = [
  "tháng một",
  "tháng hai",
  "tháng ba",
  "tháng tư",
  "tháng năm",
  "tháng sáu",
  "tháng bảy",
  "tháng tám",
  "tháng chín",
  "tháng mười",
  "tháng mười một",
  "tháng mười hai",
];

/**
 * The certificate, made to be printed and stuck on a wall (docs/06 §1.8c item 11).
 *
 * A4 landscape, one page, no navigation and no buttons on paper: what comes out of the printer is
 * the child's name, what they managed, and the date.
 */
export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { student: { select: { id: true, nickname: true, fullName: true } } },
  });
  if (!cert) notFound();
  await requireStudentAccess(cert.student.id);

  const at = cert.issuedAt;
  const when = `Ngày ${at.getDate()} ${MONTHS[at.getMonth()]} năm ${at.getFullYear()}`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#FFF8EC] p-6 print:bg-white print:p-0">
      <div
        className="relative flex aspect-[297/210] w-full max-w-[1000px] flex-col items-center justify-center gap-4 rounded-[36px] bg-white text-center shadow-[0_20px_60px_-30px_rgba(43,43,58,0.6)] print:rounded-none print:shadow-none"
        data-testid="certificate"
      >
        {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
        <img
          src="/art/effects/certificate.svg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative flex flex-col items-center gap-3 px-12">
          <p className="font-extrabold text-[26px] text-[#6B6B7B] tracking-wide">GIẤY CHỨNG NHẬN</p>
          <p className="font-black text-[56px] text-[#2B2B3A] leading-tight">
            {cert.student.nickname}
          </p>
          <p className="max-w-[36rem] font-extrabold text-[30px] text-[#2F80ED] leading-snug">
            {cert.title}
          </p>
          <p className="mt-2 text-[22px] text-[#6B6B7B]">{when}</p>
          <p className="mt-6 font-extrabold text-[20px] text-[#6B6B7B]">
            Học cùng Mai Thy &amp; Chí Thanh
          </p>
        </div>
      </div>
      <PrintButton />
    </main>
  );
}
