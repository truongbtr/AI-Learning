/**
 * Perceptual hashing for "mẹ chụp hai lần cùng một trang vở" (docs/07 §2.2).
 *
 * A dHash: shrink the picture to 9 × 8 grey pixels and keep one bit per neighbouring pair — is the
 * left pixel brighter than the right one. That survives the things that differ between two photos
 * of the same page (exposure, a little blur, a slightly different crop) and changes a lot between
 * two different pages.
 *
 * Pure on purpose: the decoding lives in the worker, which owns sharp; everything here is numbers,
 * so the interesting cases can be unit-tested without an image file.
 */

/** Width and height of the grey grid the hash is computed from. */
export const DHASH_WIDTH = 9;
export const DHASH_HEIGHT = 8;
/** Bits that may differ and still count as the same photo (out of 64). */
export const DHASH_SAME_DISTANCE = 10;

/**
 * `pixels` is row-major greyscale, DHASH_WIDTH × DHASH_HEIGHT, 0–255.
 * Returns 16 lowercase hex characters.
 */
export function dHashFromGrey(pixels: ArrayLike<number>): string {
  const expected = DHASH_WIDTH * DHASH_HEIGHT;
  if (pixels.length < expected) {
    throw new Error(`dHash needs ${expected} grey pixels, got ${pixels.length}`);
  }
  let hex = "";
  let nibble = 0;
  let bitsInNibble = 0;
  for (let y = 0; y < DHASH_HEIGHT; y++) {
    for (let x = 0; x < DHASH_WIDTH - 1; x++) {
      const left = pixels[y * DHASH_WIDTH + x] as number;
      const right = pixels[y * DHASH_WIDTH + x + 1] as number;
      nibble = (nibble << 1) | (left > right ? 1 : 0);
      bitsInNibble++;
      if (bitsInNibble === 4) {
        hex += nibble.toString(16);
        nibble = 0;
        bitsInNibble = 0;
      }
    }
  }
  return hex;
}

/** How many bits differ between two hashes; 64 means "nothing in common". */
export function hashDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let diff = Number.parseInt(a[i] as string, 16) ^ Number.parseInt(b[i] as string, 16);
    while (diff) {
      distance += diff & 1;
      diff >>= 1;
    }
  }
  return distance;
}

/** Same page photographed twice? Deliberately generous — this only raises a warning. */
export function looksLikeSamePhoto(a: string, b: string): boolean {
  return hashDistance(a, b) <= DHASH_SAME_DISTANCE;
}

/**
 * Where to cut a photo of an open notebook, from the average brightness of each column.
 *
 * The gutter between two pages is a dark vertical band near the middle. Returns the column to cut
 * at, or null when the picture is a single page — splitting a single page in two would invent a
 * second page of questions that does not exist, so the test is deliberately strict.
 */
export function findPageGutter(
  columnBrightness: ArrayLike<number>,
  opts: { aspectRatio: number } = { aspectRatio: 2 },
): number | null {
  const width = columnBrightness.length;
  if (width < 16) return null;
  // A single page photographed in portrait or square is never two pages.
  if (opts.aspectRatio < 1.35) return null;

  const from = Math.floor(width * 0.4);
  const to = Math.ceil(width * 0.6);
  let darkestAt = from;
  let darkest = Number.POSITIVE_INFINITY;
  for (let x = from; x < to; x++) {
    const value = columnBrightness[x] as number;
    if (value < darkest) {
      darkest = value;
      darkestAt = x;
    }
  }

  // Compare with the page body on both sides, not with the whole picture: a dark photo overall
  // must not look like a gutter.
  const sideAverage = (start: number, end: number) => {
    let sum = 0;
    for (let x = start; x < end; x++) sum += columnBrightness[x] as number;
    return sum / Math.max(1, end - start);
  };
  const left = sideAverage(Math.floor(width * 0.1), Math.floor(width * 0.35));
  const right = sideAverage(Math.ceil(width * 0.65), Math.ceil(width * 0.9));
  const around = (left + right) / 2;
  if (around <= 0) return null;
  return darkest < around * 0.82 ? darkestAt : null;
}
