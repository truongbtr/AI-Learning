import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertSafeKey } from "./file-storage";
import { LocalFileStorage } from "./local-file-storage";

describe("FileStorage adapter", () => {
  let root = "";
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "mtct-files-"));
  });
  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("rejects keys escaping the root", () => {
    expect(() => assertSafeKey("../etc/passwd")).toThrow();
    expect(() => assertSafeKey("/abs")).toThrow();
    expect(() => assertSafeKey("a\\b")).toThrow();
    expect(assertSafeKey("intake/2026/a.jpg")).toBe("intake/2026/a.jpg");
  });

  it("round-trips a file", async () => {
    const storage = new LocalFileStorage(root);
    const data = new TextEncoder().encode("hello");
    const stored = await storage.put("t/hello.txt", data, "text/plain");
    expect(stored.size).toBe(5);
    expect(await storage.exists("t/hello.txt")).toBe(true);
    expect(new TextDecoder().decode(await storage.get("t/hello.txt"))).toBe("hello");
    await storage.delete("t/hello.txt");
    expect(await storage.exists("t/hello.txt")).toBe(false);
  });
});
