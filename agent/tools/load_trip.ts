import { defineTool } from "eve/tools";
import { z } from "zod";
import { loadTripForUser } from "../../lib/trips";
import { requireUserId } from "../lib/auth";
import { tripSession } from "../lib/session-store";

export default defineTool({
  description: "Load a saved trip into this session so planning or booking can continue.",
  inputSchema: z.object({
    tripId: z.string().uuid(),
  }),
  async execute({ tripId }, ctx) {
    const userId = requireUserId(ctx);
    const loaded = await loadTripForUser(userId, tripId);
    tripSession.update(() => ({
      trip: loaded.trip.tripState,
      savedTripId: loaded.trip.id,
      itinerary: loaded.itinerary ?? undefined,
      comparison: loaded.comparison ?? undefined,
    }));
    return {
      tripId: loaded.trip.id,
      title: loaded.trip.title,
      trip: loaded.trip.tripState,
      itinerary: loaded.itinerary,
      comparison: loaded.comparison,
    };
  },
});
