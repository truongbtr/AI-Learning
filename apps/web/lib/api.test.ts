import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, handle, parseBody } from "./api";

describe("api helpers", () => {
  it("maps ApiError to its status", async () => {
    const res = await handle(async () => {
      throw new ApiError(403, "Không có quyền");
    })();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Không có quyền" });
  });

  it("maps Zod errors to 400 and unknown errors to 500", async () => {
    const bad = await handle(async (req: Request) => {
      await parseBody(req, z.object({ n: z.number() }));
      return new Response("ok");
    })(new Request("http://x", { method: "POST", body: JSON.stringify({ n: "no" }) }));
    expect(bad.status).toBe(400);

    const boom = await handle(async () => {
      throw new Error("boom");
    })();
    expect(boom.status).toBe(500);
  });

  it("rejects non-JSON bodies with 400", async () => {
    const res = await handle(async (req: Request) => {
      await parseBody(req, z.object({}));
      return new Response("ok");
    })(new Request("http://x", { method: "POST", body: "not json" }));
    expect(res.status).toBe(400);
  });
});
