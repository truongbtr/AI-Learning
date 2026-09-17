import { describe, expect, it } from "vitest";
import { dragNotFinished, feedbackForTry, markAttempt, twinsOf } from "./mark";

describe("multiple choice", () => {
  const key = { value: "b", errorTags: { a: "nham_b_d", c: "doan_bua" } };

  it("marks the right card right and says nothing about a diagnosis", () => {
    const m = markAttempt("MCQ", key, { choiceId: "b" });
    expect(m.correct).toBe(true);
    expect(m.score).toBe(1);
    expect(m.errorCode).toBeNull();
  });

  it("turns a wrong card into the error code the author put on it", () => {
    expect(markAttempt("MCQ", key, { choiceId: "a" }).errorCode).toBe("nham_b_d");
  });

  it("has no diagnosis for a card the author did not tag", () => {
    expect(markAttempt("MCQ", key, { choiceId: "d" }).errorCode).toBeNull();
  });

  it("records a skipped question as blank, never as a mistake of understanding", () => {
    const m = markAttempt("LISTEN_CHOOSE", key, { skipped: true });
    expect(m.errorCode).toBe("bo_trong");
    expect(m.score).toBe(0);
  });
});

describe("drag and drop", () => {
  const key = {
    value: { "zone-b": ["card-ba"], "zone-d": ["card-da", "card-de"] },
    errorTags: { "card-da": "nham_b_d" },
  };

  it("is right only when every card is home", () => {
    const m = markAttempt("DRAG_DROP", key, {
      placements: { "zone-b": ["card-ba"], "zone-d": ["card-da", "card-de"] },
    });
    expect(m.correct).toBe(true);
    expect(m.score).toBe(1);
  });

  it("scores the share that is home and names the cards that are not", () => {
    const m = markAttempt("DRAG_DROP", key, {
      placements: { "zone-b": ["card-ba", "card-da"], "zone-d": ["card-de"] },
    });
    expect(m.correct).toBe(false);
    expect(m.outcome).toBe("PARTIAL");
    expect(m.score).toBeCloseTo(2 / 3);
    expect(m.wrongItems).toEqual(["card-da"]);
    // the diagnosis comes from the card itself (ADR-15), which is what phase 2 could not do
    expect(m.errorCode).toBe("nham_b_d");
  });

  it("ignores a card the answer key does not know rather than punishing it", () => {
    const m = markAttempt("DRAG_DROP", key, {
      placements: { "zone-b": ["card-ba", "mystery"], "zone-d": ["card-da", "card-de"] },
    });
    expect(m.correct).toBe(true);
  });
});

describe("counting", () => {
  const key = { value: 5, correctCount: 5 };

  it("accepts the exact number", () => {
    expect(markAttempt("COUNT_TAP", key, { count: 5 }).correct).toBe(true);
  });

  it("tells one short from one over", () => {
    expect(markAttempt("COUNT_TAP", key, { count: 4 }).errorCode).toBe("dem_thieu_1");
    expect(markAttempt("COUNT_TAP", key, { count: 6 }).errorCode).toBe("dem_thua_1");
    expect(markAttempt("COUNT_TAP", key, { count: 2 }).errorCode).toBeNull();
  });
});

describe("reading aloud", () => {
  const key = { value: { words: ["bà", "có", "cá"] } };

  it("accepts a clean reading", () => {
    const m = markAttempt("READ_ALOUD", key, { heard: "bà có cá", seconds: 4 }, { lang: "vi" });
    expect(m.correct).toBe(true);
    expect(m.pending).toBe(false);
  });

  it("waits for a grown-up when the reading is in between", () => {
    const m = markAttempt("READ_ALOUD", key, { heard: "bà có", seconds: 5 }, { lang: "vi" });
    expect(m.outcome).toBe("PARTIAL");
    expect(m.pending).toBe(true);
    expect(m.errorCode).toBe("doc_bo_tieng");
  });

  it("takes a grown-up's word over the recogniser", () => {
    const m = markAttempt("READ_ALOUD", key, { parentVerdict: "good" }, { lang: "vi" });
    expect(m.correct).toBe(true);
    expect(m.pending).toBe(false);
  });
});

describe("what the server cannot mark", () => {
  it("leaves a photo of handwriting to the queue", () => {
    const m = markAttempt("WRITE_PHOTO", { value: null }, { photoKey: "abc" });
    expect(m.pending).toBe(true);
    expect(m.outcome).toBe("OBSERVED");
    expect(m.errorCode).toBeNull();
  });
});

describe("the three tries (docs/04 §6)", () => {
  const hints = ["Nghe lại âm đầu nhé!", "Chữ này có bụng quay về bên phải."];

  it("gives the first hint after the first wrong answer", () => {
    const f = feedbackForTry(1, hints);
    expect(f.stage).toBe("hint");
    expect(f.hintIndex).toBe(0);
    expect(f.revealAnswer).toBe(false);
  });

  it("gives the second hint after the second", () => {
    expect(feedbackForTry(2, hints).hintIndex).toBe(1);
  });

  it("shows the answer on the third and ends the attempt", () => {
    const f = feedbackForTry(3, hints);
    expect(f.stage).toBe("reveal");
    expect(f.revealAnswer).toBe(true);
    expect(f.done).toBe(true);
  });

  it("never says the word a six-year-old should not hear", () => {
    for (let tries = 1; tries <= 3; tries++) {
      for (let seed = 0; seed < 6; seed++) {
        expect(feedbackForTry(tries, hints, seed).line.toLowerCase()).not.toContain("sai");
      }
    }
  });

  it("does not leave a child guessing forever when the author wrote no hints", () => {
    expect(feedbackForTry(2, []).stage).toBe("reveal");
  });
});

describe("drag and drop with distractors that stay in the tray", () => {
  // "Kéo chữ ch vào giỏ": only ch belongs in the basket, kh and tr stay behind
  const key = {
    value: { gio: ["k1"] },
    errorTags: { d2: "nham_ch_tr" },
    cards: ["k1", "d1", "d2"],
  };

  it("is right with only the right card in the basket and the others left in the tray", () => {
    const m = markAttempt("DRAG_DROP", key, { placements: { gio: ["k1"] } });
    expect(m.correct).toBe(true);
    expect(m.wrongItems).toEqual([]);
  });

  it("is not right when a distractor goes into the basket too, and names the mix-up", () => {
    const m = markAttempt("DRAG_DROP", key, { placements: { gio: ["k1", "d2"] } });
    expect(m.correct).toBe(false);
    expect(m.wrongItems).toEqual(["d2"]);
    expect(m.errorCode).toBe("nham_ch_tr");
  });

  it("a distractor alone in the basket is a wrong answer, not a blank", () => {
    const m = markAttempt("DRAG_DROP", key, { placements: { gio: ["d1"] } });
    expect(m.correct).toBe(false);
    expect(m.outcome).toBe("INCORRECT");
    expect(m.errorCode).not.toBe("bo_trong");
  });
});

describe("half-finished drag and drop is not a mistake", () => {
  // a basket that wants two cards — 573 of the 1552 drag exercises have one
  const key = {
    value: { gio: ["k1", "k2"] },
    errorTags: { d1: "nham_ch_tr" },
    cards: ["k1", "k2", "d1"],
  };

  it("one card of the two is not finished", () => {
    expect(dragNotFinished(key, { placements: { gio: ["k1"] } })).toBe(true);
  });

  it("both cards home is an answer to mark", () => {
    expect(dragNotFinished(key, { placements: { gio: ["k1", "k2"] } })).toBe(false);
  });

  it("a distractor in the basket is an answer, wrong but finished", () => {
    expect(dragNotFinished(key, { placements: { gio: ["k1", "d1"] } })).toBe(false);
    expect(markAttempt("DRAG_DROP", key, { placements: { gio: ["k1", "d1"] } }).correct).toBe(
      false,
    );
  });

  it("a child who decides to move on is not nudged", () => {
    expect(dragNotFinished(key, { placements: { gio: ["k1"] }, skipped: true })).toBe(false);
  });

  it("an exercise whose baskets each want one card never nudges", () => {
    const single = { value: { a: ["k1"], b: ["k2"] }, cards: ["k1", "k2"] };
    expect(dragNotFinished(single, { placements: { a: ["k1"], b: ["k2"] } })).toBe(false);
    // one basket filled, the other still empty: that is half-finished too
    expect(dragNotFinished(single, { placements: { a: ["k1"] } })).toBe(true);
  });
});

describe("look-alike drag cards (pha 13: dots into a ten-frame)", () => {
  const dot = { image: { kind: "model", value: "dot", model: { kind: "counter" } } };
  const items = ["d1", "d2", "d3", "d4", "d5"].map((id) => ({ id, ...dot }));
  const twins = twinsOf(items);
  // "drag 3 dots into the frame": the key names d1-d3, d4 and d5 stay in the tray
  const key = { value: { frame: ["d1", "d2", "d3"] }, cards: items.map((i) => i.id), twins };

  it("finds the cards that look the same, and nothing when all differ", () => {
    expect(Object.keys(twins ?? {})).toHaveLength(5);
    expect(
      twinsOf([
        { id: "a", text: "<" },
        { id: "b", text: ">" },
      ]),
    ).toBeUndefined();
  });

  it("accepts any three dots", () => {
    const m = markAttempt("DRAG_DROP", key, { placements: { frame: ["d5", "d2", "d4"] } });
    expect(m.correct).toBe(true);
    expect(m.score).toBe(1);
  });

  it("still sees one dot too many, and floats back a dot the child moved", () => {
    const m = markAttempt("DRAG_DROP", key, {
      placements: { frame: ["d4", "d5", "d1", "d2"] },
    });
    expect(m.correct).toBe(false);
    expect(m.wrongItems).toHaveLength(1);
    expect(["d1", "d2", "d4", "d5"]).toContain(m.wrongItems?.[0]);
  });

  it("does not call two look-alike dots in their own frames a mix-up", () => {
    const two = {
      value: { left: ["d1"], right: ["d2"] },
      cards: ["d1", "d2"],
      twins: twinsOf(items.slice(0, 2)),
    };
    expect(
      markAttempt("DRAG_DROP", two, { placements: { left: ["d2"], right: ["d1"] } }).correct,
    ).toBe(true);
  });

  it("waits for the last dot instead of marking a half-filled frame", () => {
    expect(dragNotFinished(key, { placements: { frame: ["d4", "d5"] } })).toBe(true);
    expect(dragNotFinished(key, { placements: { frame: ["d4", "d5", "d3"] } })).toBe(false);
  });

  it("changes nothing for cards that all look different", () => {
    const plain = { value: { z: ["a"] }, cards: ["a", "b"] };
    expect(markAttempt("DRAG_DROP", plain, { placements: { z: ["b"] } }).correct).toBe(false);
  });
});

describe("an English reading is marked by how much matched", () => {
  const key = { value: { words: ["Ten", "ones", "is", "one", "ten"] } };

  it("passes at 60% and never waits for a grown-up", () => {
    const m = markAttempt(
      "READ_ALOUD",
      key,
      { heard: "ten ones is one", seconds: 4 },
      { lang: "en" },
    );
    expect(m.score).toBeCloseTo(0.8);
    expect(m.correct).toBe(true);
    expect(m.pending).toBe(false);
  });

  it("keeps the score when it lands below the bar, instead of holding the attempt", () => {
    const m = markAttempt("READ_ALOUD", key, { heard: "ten", seconds: 3 }, { lang: "en" });
    expect(m.score).toBeCloseTo(0.2); // one word of five came back
    expect(m.outcome).toBe("INCORRECT");
    expect(m.pending).toBe(false);
    expect(m.errorCode).toBe("doc_bo_tu_tieng_anh");
  });

  it("leaves Vietnamese readings to a grown-up as before", () => {
    const vi = { value: { words: ["bà", "có", "cá"] } };
    const m = markAttempt("READ_ALOUD", vi, { heard: "bà có", seconds: 5 }, { lang: "vi" });
    expect(m.pending).toBe(true);
  });
});
