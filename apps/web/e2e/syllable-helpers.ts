import { cadence } from "@mtct/core";
import { expect, type Page } from "@playwright/test";

/**
 * Playing a Xưởng Tiếng station the way a child who knows the answer would (pha 12). Shared by
 * the pha 12 spec and by every walker that meets a spelling station on its road — the world
 * quest of pha 3 and the city of pha 10.
 */

export const visible = (page: Page, id: string) =>
  page
    .getByTestId(id)
    .first()
    .isVisible()
    .catch(() => false);

/** Builds the syllable on screen by touching the right piece, then its slot, for each slot. */
export async function buildOne(page: Page) {
  const root = page.getByTestId("syl-build");
  await expect(root).toHaveAttribute("data-state", "building", { timeout: 60_000 });
  const target = (await root.getAttribute("data-target")) ?? "";
  const parts = {
    onset: (await root.getAttribute("data-onset")) ?? "",
    rime: (await root.getAttribute("data-rime")) ?? "",
    tone: (await root.getAttribute("data-tone")) ?? "",
  };
  for (const kind of ["onset", "rime", "tone"] as const) {
    if (!parts[kind]) continue;
    const slot = root.locator(`[data-testid="syl-slot"][data-kind="${kind}"]`);
    if ((await slot.getAttribute("data-filled")) === parts[kind]) continue;
    await root
      .locator(`[data-testid="piece-${kind}"][data-value="${parts[kind]}"]`)
      // the belt drifts on purpose (a conveyor), so the tile is never "stable" for Playwright
      .click({ timeout: 5000, force: true });
    await slot.click({ timeout: 5000 });
  }
  await expect(root).toHaveAttribute("data-state", /right|shown/, { timeout: 60_000 });
  return { target, spoken: (await root.getAttribute("data-spoken")) ?? "" };
}

/** Plays whatever round is on screen, the way a child who knows the answer would. */
export async function playRound(page: Page): Promise<{ game: string; met: number }> {
  const station = page.getByTestId("syllable-station");
  const round = await station.getAttribute("data-round");
  await expect
    .poll(
      async () =>
        (await visible(page, "syl-build")) ||
        (await visible(page, "syl-pair")) ||
        (await visible(page, "syl-tone")) ||
        (await visible(page, "syl-train")) ||
        (await visible(page, "syl-read")),
      { timeout: 60_000 },
    )
    .toBe(true);
  const stillHere = async () =>
    (await station.getAttribute("data-round").catch(() => null)) === round &&
    !(await visible(page, "syllable-station-done"));
  let met = 0;

  if (await visible(page, "syl-build")) {
    const game = (await page.getByTestId("syl-build").getAttribute("data-game")) ?? "build";
    while ((await visible(page, "syl-build")) && (await stillHere())) {
      const index = await page.getByTestId("syl-build").getAttribute("data-index");
      const { target, spoken } = await buildOne(page);
      // whatever the planner dealt, the machine spelled it in the school's rhythm
      expect(spoken.split("|")).toEqual(cadence(target).map((s) => s.say));
      met++;
      await expect
        .poll(
          async () =>
            !(await stillHere()) ||
            (await page
              .getByTestId("syl-build")
              .getAttribute("data-index")
              .catch(() => null)) !== index,
          { timeout: 60_000 },
        )
        .toBe(true);
    }
    return { game, met };
  }
  if (await visible(page, "syl-pair")) {
    while ((await visible(page, "syl-pair")) && (await stillHere())) {
      const root = page.getByTestId("syl-pair");
      const target = await root.getAttribute("data-target");
      await root.locator(`[data-card="${target}"]`).click();
      met++;
      await expect
        .poll(
          async () =>
            !(await stillHere()) ||
            (await root.getAttribute("data-target").catch(() => null)) !== target,
          {
            timeout: 60_000,
          },
        )
        .toBe(true);
    }
    return { game: "pair", met };
  }
  if (await visible(page, "syl-tone")) {
    while ((await visible(page, "syl-tone")) && (await stillHere())) {
      const root = page.getByTestId("syl-tone");
      const target = await root.getAttribute("data-target");
      for (let i = 0; i < 6 && (await root.getAttribute("data-at")) !== target; i++)
        await page.getByTestId("syl-tone-right").click();
      await page.getByTestId("syl-tone-done").click();
      met++;
      await expect
        .poll(
          async () =>
            !(await stillHere()) ||
            (await root.getAttribute("data-target").catch(() => null)) !== target,
          {
            timeout: 60_000,
          },
        )
        .toBe(true);
    }
    return { game: "tone", met };
  }
  if (await visible(page, "syl-train")) {
    met = await playTrain(page);
    return { game: "train", met };
  }
  // Đọc to: no microphone here, so the grown-up says "con đọc được rồi"
  while ((await visible(page, "syl-read")) && (await stillHere())) {
    const root = page.getByTestId("syl-read");
    const target = await root.getAttribute("data-target");
    if (await visible(page, "syl-read-mic")) await page.getByTestId("syl-read-mic").click();
    await page.getByTestId("syl-read-parent").click({ timeout: 10_000 });
    met++;
    await expect
      .poll(
        async () =>
          !(await stillHere()) ||
          (await root.getAttribute("data-target").catch(() => null)) !== target,
        {
          timeout: 60_000,
        },
      )
      .toBe(true);
  }
  return { game: "read", met };
}

/** Tàu chở vần: try the onsets until a wagon rolls in, then press Xong. Returns wagons found. */
export async function playTrain(page: Page): Promise<number> {
  const root = page.getByTestId("syl-train");
  const onsets = page.getByTestId("syl-train-onset");
  const n = await onsets.count();
  for (let i = 0; i < n && Number(await root.getAttribute("data-found")) < 2; i++) {
    const tile = onsets.nth(i);
    if (await tile.isDisabled()) continue;
    await tile.click();
    await expect(onsets.first()).toBeEnabled({ timeout: 60_000 });
  }
  const found = Number(await root.getAttribute("data-found"));
  await page.getByTestId("syl-train-done").click();
  return found;
}

/** Plays both rounds of the station on screen, until its "done" card shows. */
export async function playSyllableStation(page: Page): Promise<{ game: string; met: number }[]> {
  const station = page.getByTestId("syllable-station");
  await expect(station).toBeVisible({ timeout: 20_000 });
  const rounds = ((await station.getAttribute("data-games")) ?? "").split(",").length;
  const played: { game: string; met: number }[] = [];
  for (let r = 0; r < rounds; r++) {
    await expect(station).toHaveAttribute("data-round", String(r), { timeout: 60_000 });
    played.push(await playRound(page));
  }
  await expect(page.getByTestId("syllable-station-done")).toBeVisible({ timeout: 20_000 });
  return played;
}
