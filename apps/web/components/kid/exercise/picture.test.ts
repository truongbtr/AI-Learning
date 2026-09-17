import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Picture } from "./picture";

/**
 * A counting question is only as right as the picture it draws: "Trong tranh có mấy ngôi sao?"
 * with `repeat: 9` showed a single star next to the answers 8, 9 and 10 (owner, 17/09/2026).
 */
const star = { kind: "emoji", value: "⭐", labelVi: "ngôi sao" };
const images = (html: string) => html.match(/<img /g)?.length ?? 0;

describe("Picture with repeat", () => {
  it("draws the picture as many times as the question counts", () => {
    for (const n of [1, 2, 5, 6, 9, 10]) {
      const html = renderToStaticMarkup(
        createElement(Picture, { image: star, size: 200, repeat: n }),
      );
      expect(images(html), `repeat ${n}`).toBe(n);
    }
  });

  it("lays them out in rows of five, like a ten-frame", () => {
    const html = renderToStaticMarkup(
      createElement(Picture, { image: star, size: 200, repeat: 9 }),
    );
    expect(html.match(/<span class="flex items-center justify-center gap-2">/g)).toHaveLength(2);
    expect(html).toContain('aria-label="9 ngôi sao"');
  });

  it("draws one when no repeat is given", () => {
    expect(images(renderToStaticMarkup(createElement(Picture, { image: star, size: 200 })))).toBe(
      1,
    );
  });
});
