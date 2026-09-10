import { describe, expect, it } from "vitest";
import { canAccessStudent, roleAllowsArea } from "./roles";

describe("authorization rules (docs/02 §6)", () => {
  it("maps roles to areas", () => {
    expect(roleAllowsArea("CHILD", "kid")).toBe(true);
    expect(roleAllowsArea("CHILD", "parent")).toBe(false);
    expect(roleAllowsArea("PARENT", "parent")).toBe(true);
    expect(roleAllowsArea("PARENT", "admin")).toBe(false);
    expect(roleAllowsArea("PARENT", "kid")).toBe(false);
    expect(roleAllowsArea("ADMIN", "admin")).toBe(true);
    expect(roleAllowsArea("ADMIN", "kid")).toBe(true);
  });
  it("CHILD sees only its own student", () => {
    expect(canAccessStudent({ role: "CHILD", studentId: "s1" }, "s1")).toBe(true);
    expect(canAccessStudent({ role: "CHILD", studentId: "s1" }, "s2")).toBe(false);
  });
  it("PARENT sees only linked students", () => {
    const p = { role: "PARENT" as const, guardianStudentIds: ["s1"] };
    expect(canAccessStudent(p, "s1")).toBe(true);
    expect(canAccessStudent(p, "s2")).toBe(false);
    expect(canAccessStudent({ role: "PARENT" }, "s1")).toBe(false);
  });
  it("ADMIN sees everything", () => {
    expect(canAccessStudent({ role: "ADMIN" }, "anything")).toBe(true);
  });
});
