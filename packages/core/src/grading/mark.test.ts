import { describe, expect, it } from "vitest";
import { feedbackForTry, markAttempt } from "./mark";

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
