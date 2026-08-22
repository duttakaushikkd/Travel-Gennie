import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchAndRankFares } from "../../lib/amadeus";
import { enforceRateLimit } from "../../lib/rate-limit";
import { missingTripFields } from "../../lib/trip";
import { rateLimitKey } from "../lib/auth";
import { tripSession } from "../lib/session-store";

export default defineTool({
  description:
    "Search licensed flight offers when configured, rank them, and attach MakeMyTrip / Goibibo / EaseMyTrip deep links. Never invent prices.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    await enforceRateLimit(rateLimitKey(ctx), "fares");
    const { trip } = tripSession.get();
    const missing = missingTripFields(trip);
    if (missing.length > 0) {
      throw new Error(`Trip brief incomplete: ${missing.join(", ")}`);
    }

    const comparison = await searchAndRankFares(trip);
    tripSession.update((current) => ({
      ...current,
      comparison,
      trip: { ...current.trip, status: "comparing" },
    }));
    return comparison;
  },
});
