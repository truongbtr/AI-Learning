import type { ChatIntakeInput } from "@mtct/db";
import { describe, expect, it } from "vitest";
import { type IntakeExtraction, intakeExtractionSchema } from "./schemas";

/**
 * One page, one meaning.
 *
 * A photo of the same worksheet can arrive two ways: through the queue (`inbox:pull` →
 * `result.json` → `inbox:push`) or straight from the phone through `POST /api/internal/intake`
 * (docs/13 §7). `@mtct/db` cannot import this package — it is the other way round — so the chat
 * door restates the shape in `ChatIntakeInput`. This file is the only thing standing between that
 * restatement and a slow drift where the same reading means two different things depending on which
 * door it came through. It fails to compile rather than at runtime, which is the point.
 */

describe("the chat door and the AI queue describe a page the same way", () => {
  it("an IntakeExtraction is a valid ChatIntakeInput", () => {
    const parsed: IntakeExtraction = intakeExtractionSchema.parse({
      kind: "PHOTO_INTAKE",
      docType: "WORKBOOK",
      subject: "VMATH",
      summary: "phiếu cộng trong phạm vi 10",
      confidence: 0.9,
      items: [
        {
          index: 0,
          questionText: "3 + 4 =",
          studentAnswer: "7",
          outcome: "CORRECT",
          skillCodes: ["VMATH.SO.CONG_PV_10"],
          bbox: [0.1, 0.2, 0.3, 0.1],
        },
        { index: 1, questionText: "8 + 5 =", outcome: "BLANK" },
      ],
      externals: [{ platform: "KIDSAZ", metric: "raz_level", value: "C" }],
    });

    // The assignment is the test: tsc rejects it the moment the two shapes disagree.
    const asChat: ChatIntakeInput = parsed;
    expect(asChat.kind).toBe("PHOTO_INTAKE");
    expect(asChat.items?.[1]?.outcome).toBe("BLANK");
    expect(asChat.externals?.[0]?.metric).toBe("raz_level");
  });
});
