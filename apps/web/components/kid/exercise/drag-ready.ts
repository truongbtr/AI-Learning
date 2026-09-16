/**
 * When "Xong!" lights up in a drag exercise. Pure, so the rule that decides whether a six-year-old
 * can hand in a half-finished answer is covered by a test rather than by a click-through.
 *
 * Two ways to be ready:
 *  - every basket holds as many cards as it wants (`expect` — the count from the answer key, never
 *    which cards), or
 *  - the tray is empty, so there is nothing left to place.
 *
 * `expect` arrives with pha 11. A session that started on an older spec has none, and the old rule
 * ("a card in every basket") applies — the server nudges instead, see `dragNotFinished`.
 */
export interface ReadyZone {
  id: string;
  expect?: number;
}

export function dragReady(
  zones: ReadyZone[],
  itemIds: string[],
  placed: Record<string, string | undefined>,
): boolean {
  if (zones.length === 0 || itemIds.length === 0) return false;
  const trayEmpty = itemIds.every((id) => placed[id]);
  if (trayEmpty) return true;
  const inZone = (zoneId: string) =>
    Object.values(placed).filter((placedIn) => placedIn === zoneId).length;
  return zones.every((z) => inZone(z.id) >= Math.max(1, z.expect ?? 1));
}
