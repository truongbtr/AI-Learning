import { describe, expect, it } from "vitest";
import { pickVoice } from "./voices";

const voices = [
  { name: "Microsoft Zira - English (United States)", lang: "en-US", localService: true },
  { name: "Microsoft David - English (United States)", lang: "en-US", localService: true },
];

describe("pickVoice", () => {
  it("returns null when the browser has no voice for the language (never read vi with an en voice)", () => {
    expect(pickVoice(voices, "vi-VN")).toBeNull();
  });

  it("prefers the natural northern Vietnamese voices over the offline one", () => {
    const withVi = [
      ...voices,
      { name: "Microsoft An - Vietnamese (Vietnam)", lang: "vi-VN", localService: true },
      {
        name: "Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)",
        lang: "vi-VN",
        localService: false,
      },
    ];
    expect(pickVoice(withVi, "vi-VN")?.name).toContain("HoaiMy");
  });

  it("falls back to any voice of the language when none is in the preference list", () => {
    const withVi = [...voices, { name: "Some Vendor Vietnamese", lang: "vi_VN" }];
    expect(pickVoice(withVi, "vi-VN")?.name).toBe("Some Vendor Vietnamese");
  });

  it("picks a natural English voice for en-US when available", () => {
    const withNatural = [
      ...voices,
      {
        name: "Microsoft Aria Online (Natural) - English (United States)",
        lang: "en-US",
        localService: false,
      },
    ];
    expect(pickVoice(withNatural, "en-US")?.name).toContain("Aria");
  });
});
