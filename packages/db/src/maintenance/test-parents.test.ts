import { describe, expect, it } from "vitest";
import { classifyParent, type ParentChildLink } from "./test-parents";

const child = (slug: string, isProtected = false): ParentChildLink => ({
  studentId: `id-${slug}`,
  slug,
  nickname: slug === "thy" ? "Mai Thy" : slug === "thanh" ? "Chí Thanh" : "Bé Thử",
  isProtected,
});

const parent = (over: Partial<Parameters<typeof classifyParent>[0]> = {}) => ({
  username: "me-22wji",
  role: "PARENT",
  isActive: false,
  children: [] as ParentChildLink[],
  ...over,
});

describe("cleaning up e2e parent accounts (docs/08 pha 8 việc 0.2)", () => {
  it("deletes a disabled e2e login with no children left", () => {
    expect(classifyParent(parent()).verdict).toBe("DELETE");
  });

  /**
   * The one the owner asked to be checked before anything was deleted. A junk-looking username is
   * not enough: if Ba or Mẹ's real login happens to match the pattern, the link to Mai Thy or Chí
   * Chí Thanh is what decides, and it decides "keep".
   */
  it("keeps an account still linked to a real child, whatever its username looks like", () => {
    for (const slug of ["thy", "thanh"]) {
      const verdict = classifyParent(parent({ children: [child(slug, true)] }));
      expect(verdict.verdict).toBe("KEEP_LINKED_REAL");
      expect(verdict.why).toContain("hồ sơ thật");
    }
  });

  it("keeps an account linked to any surviving profile, real or not", () => {
    expect(classifyParent(parent({ children: [child("thy-bo9kq")] })).verdict).toBe(
      "KEEP_HAS_CHILDREN",
    );
  });

  it("leaves a username it does not recognise alone", () => {
    expect(classifyParent(parent({ username: "me" })).verdict).toBe("KEEP_UNRECOGNISED");
    expect(classifyParent(parent({ username: "truongbt" })).verdict).toBe("KEEP_UNRECOGNISED");
  });

  it("leaves an enabled account alone — somebody may be using it", () => {
    expect(classifyParent(parent({ isActive: true })).verdict).toBe("KEEP_UNRECOGNISED");
  });

  it("never touches an admin", () => {
    expect(classifyParent(parent({ role: "ADMIN", username: "ba-22wji" })).verdict).toBe(
      "KEEP_UNRECOGNISED",
    );
  });

  it("recognises both shapes the suites generate", () => {
    expect(classifyParent(parent({ username: "me-k2ihg" })).verdict).toBe("DELETE");
    expect(classifyParent(parent({ username: "ba-7camy" })).verdict).toBe("DELETE");
  });
});
