import { CITY_SUBJECTS, type CitySubject, PLOT_BUILD_ORDER } from "@mtct/core";
import { z } from "zod";

/**
 * What the city screens may send (Pha 10 việc 3). Only identifiers: the server recomputes the city
 * from learning data and decides whether a plot is open, a build unlocked or a building waiting.
 */
export const citySubjectSchema = z.enum(CITY_SUBJECTS as [CitySubject, ...CitySubject[]]);

export const cityQuerySchema = z.object({
  studentId: z.string().min(1),
  city: citySubjectSchema,
});

export const citySeenSchema = cityQuerySchema;

export const cityPlotSchema = cityQuerySchema.extend({
  plot: z.number().int().min(0).max(500),
  build: z.enum(PLOT_BUILD_ORDER as unknown as [string, ...string[]]),
});

export const cityAgainSchema = cityQuerySchema;
