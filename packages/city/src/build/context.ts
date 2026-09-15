import type { CityPalette } from "../palette";
import type { KenneyLibrary } from "./kenney";
import type { SignAtlas } from "./signs";

/** Everything a builder may need; one per city render. */
export interface BuildCtx {
  city: CityPalette;
  lib: KenneyLibrary;
  atlas: SignAtlas;
}

/** CSS hex for sign painting. */
export const css = (hex: number) => `#${hex.toString(16).padStart(6, "0")}`;
