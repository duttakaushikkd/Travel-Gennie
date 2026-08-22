import { z } from "zod";

export const tripStatusSchema = z.enum([
  "intake",
  "planned",
  "comparing",
  "ready",
]);

export const tripPaceSchema = z.enum(["relaxed", "balanced", "packed"]);

export const travelModeSchema = z.enum(["flight", "train", "bus"]);

export const tripStateSchema = z.object({
  originCity: z.string().min(1).optional(),
  originIata: z
    .string()
    .length(3)
    .transform((value) => value.toUpperCase())
    .optional(),
  destinationCity: z.string().min(1).optional(),
  destinationIata: z
    .string()
    .length(3)
    .transform((value) => value.toUpperCase())
    .optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().int().min(1).max(9).default(1),
  children: z.number().int().min(0).max(8).default(0),
  infants: z.number().int().min(0).max(4).default(0),
  budgetInr: z.number().positive().optional(),
  pace: tripPaceSchema.default("balanced"),
  modes: z.array(travelModeSchema).default(["flight"]),
  constraints: z.string().optional(),
  status: tripStatusSchema.default("intake"),
});

export type TripState = z.infer<typeof tripStateSchema>;

export const itineraryItemSchema = z.object({
  time: z.string(),
  place: z.string(),
  why: z.string(),
  estCost: z.number().nonnegative().optional(),
});

export const itineraryDaySchema = z.object({
  title: z.string(),
  items: z.array(itineraryItemSchema),
});

export const itinerarySchema = z.object({
  days: z.array(itineraryDaySchema),
  notes: z.string().optional(),
});

export type Itinerary = z.infer<typeof itinerarySchema>;

export const otaPlatformSchema = z.enum(["makemytrip", "goibibo", "easemytrip"]);

export type OtaPlatform = z.infer<typeof otaPlatformSchema>;

export const deepLinkSchema = z.object({
  platform: otaPlatformSchema,
  label: z.string(),
  url: z.string().url(),
});

export const fareOptionSchema = z.object({
  id: z.string(),
  originIata: z.string(),
  destinationIata: z.string(),
  departureAt: z.string(),
  arrivalAt: z.string(),
  durationMinutes: z.number(),
  stops: z.number(),
  carrier: z.string(),
  amount: z.number().nullable(),
  currency: z.string().default("INR"),
  source: z.enum(["amadeus", "deep_link_only"]),
  deepLinks: z.array(deepLinkSchema),
});

export type FareOption = z.infer<typeof fareOptionSchema>;

export const fareComparisonSchema = z.object({
  quotedAt: z.string(),
  disclaimer: z.string(),
  cheapestPlatform: z.string().nullable(),
  options: z.array(fareOptionSchema),
});

export type FareComparison = z.infer<typeof fareComparisonSchema>;

export const requiredTripFields = [
  "originCity",
  "destinationCity",
  "startDate",
  "endDate",
] as const;

export function missingTripFields(trip: TripState): string[] {
  const missing: string[] = [];
  for (const field of requiredTripFields) {
    if (!trip[field]) missing.push(field);
  }
  if (trip.modes.includes("flight") && (!trip.originIata || !trip.destinationIata)) {
    missing.push("originIata/destinationIata");
  }
  return missing;
}

export function emptyTripState(): TripState {
  return tripStateSchema.parse({
    adults: 1,
    children: 0,
    infants: 0,
    pace: "balanced",
    modes: ["flight"],
    status: "intake",
  });
}
