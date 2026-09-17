import { EMOJI_PICTURES } from "./emoji-set";
import { imageSrc } from "./types";

/** Codepoints joined by "-", lower case, without FE0F — the file name in /art/emoji/. */
export function emojiKey(value: string): string {
  return [...value]
    .map((ch) => (ch.codePointAt(0) as number).toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-");
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

/** "🐔🦆" → ["🐔", "🦆"]; one emoji (even a ZWJ family) stays one. */
function graphemes(value: string): string[] {
  if (!segmenter) return [value];
  return [...segmenter.segment(value)].map((s) => s.segment).filter((g) => g.trim().length > 0);
}

/**
 * A picture in an exercise, drawn big and sharp on every device (pha 10b). Emoji are shown as
 * Noto Color Emoji SVGs rather than as text: Windows draws a text emoji at about half its font
 * size, so a "92px" ship looked like a thumbnail. Art objects keep their SVG. Anything without a
 * picture (a plain symbol) falls back to text of the same size.
 */
export function Picture({
  image,
  size,
  className = "",
  alt,
  repeat = 1,
}: {
  image: { kind: string; value: string; labelVi?: string };
  /** Pixel size of one picture (square). */
  size: number;
  className?: string;
  alt?: string;
  /**
   * Draw the picture this many times — "Trong tranh có mấy ngôi sao?" with `repeat: 9` must show
   * nine stars, not one (owner, 17/09/2026: a single star with answers 8, 9, 10). Laid out in rows
   * of five like a ten-frame, so a six-year-old can count them.
   */
  repeat?: number;
}) {
  const count = Math.max(1, Math.min(20, Math.floor(repeat)));
  if (count > 1) {
    const each = Math.round(size * (count <= 3 ? 0.62 : 0.5));
    const rows: number[][] = [];
    for (let i = 0; i < count; i += 5)
      rows.push(Array.from({ length: Math.min(5, count - i) }, (_, k) => i + k));
    return (
      <span
        className={`inline-flex flex-col items-center gap-2 ${className}`}
        role="img"
        aria-label={`${count} ${alt ?? image.labelVi ?? ""}`.trim()}
        data-testid="picture-repeat"
        data-count={count}
      >
        {rows.map((row) => (
          <span key={`row-${row[0]}`} className="flex items-center justify-center gap-2">
            {row.map((n) => (
              <Picture key={`copy-${n}`} image={image} size={each} alt="" />
            ))}
          </span>
        ))}
      </span>
    );
  }
  const label = alt ?? image.labelVi ?? "";
  const asset = imageSrc(image.value, image.kind);
  if (asset) {
    return (
      // biome-ignore lint/performance/noImgElement: local SVG asset
      <img
        src={asset}
        alt={label}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const parts = graphemes(image.value);
  if (
    image.kind === "emoji" &&
    parts.length > 0 &&
    parts.every((p) => EMOJI_PICTURES.has(emojiKey(p)))
  ) {
    // a small scene ("🐔🦆") shares the space instead of overflowing the card
    const each = parts.length === 1 ? size : Math.round(size * 0.72);
    // the same emoji may repeat in a scene: number its occurrences for a stable key
    const seen = new Map<string, number>();
    const keyed = parts.map((p) => {
      const n = (seen.get(p) ?? 0) + 1;
      seen.set(p, n);
      return { p, id: `${p}#${n}` };
    });
    return (
      <span
        className={`inline-flex items-center justify-center gap-1 ${className}`}
        role="img"
        aria-label={label}
      >
        {keyed.map(({ p, id }) => (
          // biome-ignore lint/performance/noImgElement: local SVG asset
          <img
            key={id}
            src={`/art/emoji/${emojiKey(p)}.svg`}
            alt=""
            width={each}
            height={each}
            draggable={false}
            className="object-contain"
            style={{ width: each, height: each }}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      className={`leading-none ${className}`}
      style={{ fontSize: size * 0.8 }}
      role="img"
      aria-label={label}
    >
      {image.value}
    </span>
  );
}
