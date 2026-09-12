import { describe, expect, it } from "vitest";
import { classify, looksLikeTestSlug, type StudentDataCounts } from "./test-students";

const empty: StudentDataCounts = {
  evidence: 0,
  intakePhotoEvidence: 0,
  sessions: 0,
  attempts: 0,
  intakeJobs: 0,
  homeworks: 0,
  conversations: 0,
};

describe("cleaning up e2e child profiles (docs/08 pha 5 việc 0.2)", () => {
  it("never treats the two real children as candidates", () => {
    expect(looksLikeTestSlug("thy")).toBe(false);
    expect(looksLikeTestSlug("thanh")).toBe(false);
    for (const slug of ["thy", "thanh"])
      expect(classify({ slug, isActive: true, counts: empty }).verdict).toBe("KEEP_PROTECTED");
  });

  it("protects the real children even when their account is off and their profile is empty", () => {
    expect(classify({ slug: "thy", isActive: false, counts: empty }).verdict).toBe(
      "KEEP_PROTECTED",
    );
  });

  it("recognises the slugs each acceptance suite generates", () => {
    expect(looksLikeTestSlug("p1kid-bllrg")).toBe(true);
    expect(looksLikeTestSlug("thy-bo9kq")).toBe(true);
    expect(looksLikeTestSlug("thanh-22wji")).toBe(true);
    expect(looksLikeTestSlug("e2e-anything-at-all")).toBe(true);
  });

  it("leaves a slug it does not recognise alone", () => {
    expect(looksLikeTestSlug("minh")).toBe(false);
    expect(classify({ slug: "minh", isActive: false, counts: empty }).verdict).toBe(
      "KEEP_UNRECOGNISED",
    );
  });

  it("deletes an empty profile with an e2e slug and a disabled account", () => {
    const { verdict } = classify({ slug: "p1kid-bllrg", isActive: false, counts: empty });
    expect(verdict).toBe("DELETE");
  });

  it("keeps an e2e-named profile whose account is still switched on", () => {
    expect(classify({ slug: "p1kid-bllrg", isActive: true, counts: empty }).verdict).toBe(
      "KEEP_UNRECOGNISED",
    );
  });

  /**
   * The one that matters: a photo of real schoolwork landed on a junk-named profile. Whatever the
   * name says, that is a child's work and the script has to hand it back to a parent instead of
   * deleting it.
   */
  it("keeps a junk-named profile that carries a photo of schoolwork, and says so", () => {
    const { verdict, why } = classify({
      slug: "p1kid-bm59a",
      isActive: false,
      counts: { ...empty, evidence: 3, intakePhotoEvidence: 3 },
    });
    expect(verdict).toBe("KEEP_HAS_DATA");
    expect(why).toContain("3 bằng chứng từ ảnh bài vở");
  });

  it.each([
    ["sessions", { sessions: 3 }, "3 phiên"],
    ["attempts", { attempts: 12 }, "12 lượt làm bài"],
    ["intake jobs", { intakeJobs: 1 }, "1 lô ảnh"],
    ["homework", { homeworks: 2 }, "2 bài cô giao"],
    ["conversations", { conversations: 1 }, "1 hội thoại"],
  ])("keeps a profile that only has %s", (_label, extra, expected) => {
    const { verdict, why } = classify({
      slug: "thy-bo9kq",
      isActive: false,
      counts: { ...empty, ...extra },
    });
    expect(verdict).toBe("KEEP_HAS_DATA");
    expect(why).toContain(expected);
  });

  it("separates photo evidence from the rest when reporting why it kept one", () => {
    const { why } = classify({
      slug: "p1kid-bllrg",
      isActive: false,
      counts: { ...empty, evidence: 11, intakePhotoEvidence: 4, attempts: 12 },
    });
    expect(why).toContain("4 bằng chứng từ ảnh bài vở");
    expect(why).toContain("7 bằng chứng khác");
    expect(why).toContain("12 lượt làm bài");
  });
});

/**
 * The database integration tests build a child with `createTempStudent` and remove it in
 * `afterAll` — unless the run is interrupted, in which case one is left in the dev database. The
 * first real run of the cleanup script found one, which is how this pattern got here.
 */
describe("leftovers from the integration tests", () => {
  it("recognises the temp students createTempStudent makes", () => {
    expect(looksLikeTestSlug("test-session-mtxnqp3y")).toBe(true);
    expect(looksLikeTestSlug("itest-mastery-ab12cd")).toBe(true);
  });

  it("still refuses to touch a name that merely starts with the same letters", () => {
    expect(looksLikeTestSlug("teo")).toBe(false);
    expect(looksLikeTestSlug("testudo van A")).toBe(false);
  });
});
