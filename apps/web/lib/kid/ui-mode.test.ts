import { describe, expect, it } from "vitest";
import { kidUiMode } from "./ui-mode";

describe("KID_UI flag", () => {
  it("defaults to the old world and switches only on 'city'", () => {
    expect(kidUiMode({})).toBe("world");
    expect(kidUiMode({ KID_UI: "world" })).toBe("world");
    expect(kidUiMode({ KID_UI: " City " })).toBe("city");
    expect(kidUiMode({ KID_UI: "3d" })).toBe("world");
  });
});
