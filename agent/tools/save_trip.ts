import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveTripForUser } from "../../lib/trips";
import { requireUserId } from "../lib/auth";
import { tripSession } from "../lib/session-store";

export default defineTool({
  description: "Persist the current trip, itinerary, and latest fare comparison for the signed-in user.",
  inputSchema: z.object({
    title: z.string().optional(),
  }),
  async execute({ title }, ctx) {
    const userId = requireUserId(ctx);
    const state = tripSession.get();
    const saved = await saveTripForUser({
      userId,
      tripId: state.savedTripId,
      tripState: state.trip,
      title,
      itinerary: state.itinerary,
      comparison: state.comparison,
    });
    tripSession.update((current) => ({ ...current, savedTripId: saved.tripId }));
    return saved;
  },
});
