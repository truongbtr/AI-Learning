"use client";

import { useRouter } from "next/navigation";
import { BigButton } from "@/components/kid/buttons";

/** Two buttons that are never on the paper itself. */
export function PrintButton() {
  const router = useRouter();
  return (
    <div className="flex flex-wrap justify-center gap-4 print:hidden">
      <BigButton tone="reward" onClick={() => window.print()}>
        🖨️ In ra
      </BigButton>
      <BigButton tone="quiet" onClick={() => router.push("/kid/collection")}>
        ⬅️ Quay lại
      </BigButton>
    </div>
  );
}
