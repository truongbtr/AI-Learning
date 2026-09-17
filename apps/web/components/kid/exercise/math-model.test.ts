import { type MathModel, mathModelSchema } from "@mtct/content";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isCounter, slotLabel, tenFrameOf } from "./drag-ready";
import { MathModelPicture, type ModelLayout, modelHeight } from "./math-model";
import { Picture } from "./picture";

/**
 * Pha 13: the MATH NOTES models are drawn from data. Each test renders the real component to HTML
 * and counts what a child would count — a ten-frame that shows 16 dots for "17" is a wrong question.
 */
const parse = (m: unknown) => mathModelSchema.parse(m) as MathModel;
const html = (m: unknown, size = 208, layout: ModelLayout = "wide") =>
  renderToStaticMarkup(createElement(MathModelPicture, { model: parse(m), size, layout }));
const count = (s: string, needle: string) => s.split(needle).length - 1;
const viewBox = (s: string) => {
  const [, , w, h] = (/viewBox="([^"]+)"/.exec(s)?.[1] ?? "").split(" ").map(Number);
  return { w: w as number, h: h as number };
};
const attr = (s: string, name: string) => Number(new RegExp(` ${name}="([\\d.]+)"`).exec(s)?.[1]);
/** The smallest text on screen, in px, when the picture is drawn `drawnWidth` wide. */
const smallestText = (s: string, drawnWidth: number) => {
  const sizes = [...s.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
  return (Math.min(...sizes) * drawnWidth) / viewBox(s).w;
};
const drawnWidth = (s: string, container: number) => Math.min(attr(s, "width"), container);

describe("ten-frame", () => {
  it("draws 17 as a full frame and 7 more", () => {
    const s = html({ kind: "tenFrame", frames: 2, dots: [{ count: 17 }] });
    expect(count(s, 'data-dot="dark"')).toBe(17);
    expect(s).toContain('aria-label="two ten-frames with 17 dots"');
    expect(viewBox(s).w).toBeGreaterThan(viewBox(s).h * 3); // side by side, 5 × 2
  });

  it("draws the make-ten picture in two colours: 7 dark and 5 light", () => {
    const s = html({
      kind: "tenFrame",
      frames: 2,
      dots: [
        { count: 7, tone: "dark" },
        { count: 5, tone: "light" },
      ],
    });
    expect(count(s, 'data-dot="dark"')).toBe(7);
    expect(count(s, 'data-dot="light"')).toBe(5);
  });

  it("stands up like the book on an answer card, and three answers fit one row", () => {
    const s = html({ kind: "tenFrame", frames: 2, dots: [{ count: 19 }] }, 128, "tall");
    expect(viewBox(s).h).toBeGreaterThan(viewBox(s).w);
    // three answer cards (picture + 48 px padding) and two 16 px gaps inside the 1024 px frame
    expect(3 * (attr(s, "width") + 48) + 2 * 16).toBeLessThanOrEqual(1024);
  });

  it("refuses more dots than cells", () => {
    expect(mathModelSchema.safeParse({ kind: "tenFrame", dots: [{ count: 11 }] }).success).toBe(
      false,
    );
  });
});

describe("tens and ones", () => {
  it("draws 13 as one rod of ten and three cubes", () => {
    const s = html({ kind: "tensOnes", tens: 1, ones: 3 });
    expect(count(s, 'data-cube="rod"')).toBe(10);
    expect(count(s, 'data-cube="one"')).toBe(3);
  });

  it("draws the book's trap: a rod of nine", () => {
    const s = html({ kind: "tensOnes", tens: 1, ones: 3, rodSize: 9 });
    expect(count(s, 'data-cube="rod"')).toBe(9);
  });

  it("draws a bead string of ten and seven loose beads", () => {
    const s = html({ kind: "tensOnes", tens: 1, ones: 7, style: "beads" });
    expect(count(s, "<circle")).toBe(17);
    expect(s).toContain("bead string");
  });

  it("stays inside the question slot", () => {
    const s = html({ kind: "tensOnes", tens: 2, ones: 0 });
    expect(attr(s, "height")).toBeLessThanOrEqual(260);
  });
});

describe("number line", () => {
  const nine = {
    kind: "numberLine",
    from: 0,
    to: 20,
    labels: [0, 5, 10, 15, 20],
    hops: { start: 9, count: 3 },
  };

  it("draws 9 + 3 as three hops from 9, with sparse labels", () => {
    const s = html(nine);
    expect(count(s, "data-hop=")).toBe(3);
    expect(count(s, 'data-dot="dark"')).toBe(1);
    expect(count(s, "<text")).toBe(5);
    expect(count(s, 'x1="')).toBeGreaterThanOrEqual(21); // every mark is there, labelled or not
  });

  it("shows ? boxes for the missing numbers", () => {
    const s = html({ kind: "numberLine", from: 10, to: 16, hidden: [13, 14] });
    expect(count(s, "data-hidden=")).toBe(2);
    expect(s).not.toContain(">13<");
  });

  it("keeps its numbers at 22 px or more on a laptop and on an iPad", () => {
    const s = html(nine, 136);
    expect(smallestText(s, drawnWidth(s, 1000))).toBeGreaterThanOrEqual(22);
    expect(smallestText(s, drawnWidth(s, 720))).toBeGreaterThanOrEqual(21.5);
  });

  it("refuses hops that run off the line", () => {
    expect(
      mathModelSchema.safeParse({
        kind: "numberLine",
        from: 0,
        to: 10,
        hops: { start: 9, count: 3 },
      }).success,
    ).toBe(false);
  });
});

describe("number bond", () => {
  it("draws 5 split into 3 and 2 under the whole", () => {
    const s = html({ kind: "numberBond", whole: 5, parts: [3, 2] });
    expect(count(s, "data-bond=")).toBe(3);
    expect(s).toContain(">5<");
    expect(s).toContain(">3<");
    expect(s).toContain(">2<");
  });

  it("puts a ? where the question is, and stays readable on a short screen", () => {
    const s = html({ kind: "numberBond", whole: null, parts: [7, 5] }, 136);
    expect(s).toContain(">?<");
    expect(smallestText(s, attr(s, "width"))).toBeGreaterThanOrEqual(22);
  });

  it("refuses parts that do not add up", () => {
    expect(
      mathModelSchema.safeParse({ kind: "numberBond", whole: 12, parts: [7, 4] }).success,
    ).toBe(false);
  });
});

describe("dot cards, the number chart and a counter", () => {
  it("draws two cards of 8 dots", () => {
    const s = html({ kind: "dotCards", cards: [8, 8] });
    expect(count(s, "data-card=")).toBe(2);
    expect(count(s, 'data-dot="dark"')).toBe(16);
  });

  it("draws the 1–20 chart with ? cells, readable on a short screen", () => {
    const s = html({ kind: "numberChart", hidden: [9, 18] }, 136);
    expect(count(s, "data-cell=")).toBe(20);
    expect(count(s, ">?<")).toBe(2);
    expect(smallestText(s, drawnWidth(s, 1000))).toBeGreaterThanOrEqual(22);
  });

  it("draws one counter", () => {
    expect(count(html({ kind: "counter", tone: "light" }, 104), 'data-dot="light"')).toBe(1);
  });
});

describe("every model", () => {
  const all: unknown[] = [
    { kind: "tenFrame", frames: 2, dots: [{ count: 14 }] },
    { kind: "tensOnes", tens: 1, ones: 6 },
    { kind: "numberLine", from: 3, to: 17, marks: [4, 7] },
    { kind: "numberBond", whole: 10, parts: [6, null] },
    { kind: "dotCards", cards: [5, 5] },
    { kind: "numberChart" },
    { kind: "counter" },
  ];

  it("is drawn without red and without the word 'sai'", () => {
    for (const m of all)
      for (const layout of ["wide", "tall"] as const) {
        const s = html(m, 208, layout).toLowerCase();
        expect(s).not.toMatch(/#(e5|ff3b30|ff0000|d32f2f|f44336|eb5757)/);
        expect(s).not.toMatch(/\bred\b|\bsai\b/);
      }
  });

  it("fits the question slot of a 1280 × 720 screen and of a short screen", () => {
    for (const m of all) {
      const model = parse(m);
      expect(modelHeight(model, 208, "wide"), model.kind).toBeLessThanOrEqual(260);
      expect(modelHeight(model, 136, "wide"), model.kind).toBeLessThanOrEqual(180);
    }
  });

  it("goes through Picture, which ignores repeat for a model", () => {
    const s = renderToStaticMarkup(
      createElement(Picture, {
        image: { kind: "model", value: "tf-14", model: parse(all[0]) },
        size: 208,
        repeat: 5,
      }),
    );
    expect(count(s, 'data-testid="math-model"')).toBe(1);
    expect(count(s, 'data-dot="dark"')).toBe(14);
  });
});

describe("drag baskets built from models", () => {
  const tf = {
    kind: "model",
    value: "tf",
    model: parse({ kind: "tenFrame", dots: [{ count: 7 }] }),
  };
  it("recognises a ten-frame basket, a counter card and a sign slot", () => {
    expect(tenFrameOf({ id: "z", expect: 3, image: tf })?.dots[0]?.count).toBe(7);
    expect(tenFrameOf({ id: "z", expect: 1, label: "Teen" })).toBeNull();
    expect(
      isCounter({
        id: "d1",
        image: { kind: "model", value: "c", model: parse({ kind: "counter" }) },
      }),
    ).toBe(true);
    expect(isCounter({ id: "d1", text: "7" })).toBe(false);
    expect(slotLabel("15 ○ 12")).toEqual(["15", "12"]);
    expect(slotLabel("16  17  ○")).toEqual(["16  17", ""]);
    expect(slotLabel("More than 5")).toBeNull();
  });
});
