import { describe, expect, it } from "vitest";
import { speechLang } from "./speech-lang";

describe("speechLang", () => {
  it("reads English lines of an English exercise in English", () => {
    expect(speechLang("A toy inside a box.", "en")).toBe("en-US");
  });
  it("reads a Vietnamese line in Vietnamese even inside an English exercise", () => {
    expect(speechLang("Kéo chậm, thẻ sẽ tự dính vào ô.", "en")).toBe("vi-VN");
  });
  it("keeps Vietnamese exercises in Vietnamese", () => {
    expect(speechLang("ba", "vi")).toBe("vi-VN");
    expect(speechLang("Kéo chữ ch vào giỏ.", "vi")).toBe("vi-VN");
  });
});
