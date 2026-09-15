import { describe, expect, it } from "vitest";
import { kidUiMode } from "./ui-mode";

describe("KID_UI flag", () => {
  it("defaults to the old world and switches only on 'city'", () => {
    expect(kidUiMode({})).toBe("world");
    expect(kidUiMode({ KID_UI: "world" })).toBe("world");
    expect(kidUiMode({ KID_UI: " City " })).toBe("city");
    expect(kidUiMode({ KID_UI: "3d" })).toBe("world");
  });

  it("a device cookie wins over the environment, both ways", () => {
    expect(kidUiMode({ KID_UI: "world" }, "city")).toBe("city");
    expect(kidUiMode({}, "city")).toBe("city");
    expect(kidUiMode({ KID_UI: "city" }, "world")).toBe("world");
  });

  it("without a (valid) cookie the environment decides", () => {
    expect(kidUiMode({ KID_UI: "city" }, undefined)).toBe("city");
    expect(kidUiMode({ KID_UI: "city" }, null)).toBe("city");
    expect(kidUiMode({ KID_UI: "world" }, "")).toBe("world");
    expect(kidUiMode({ KID_UI: "city" }, "mars")).toBe("city");
  });
});
