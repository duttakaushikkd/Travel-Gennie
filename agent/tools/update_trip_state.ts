import { defineTool } from "eve/tools";
import { tripSession } from "../lib/session-store";
import { missingTripFields, tripStateSchema } from "../../lib/trip";

export default defineTool({
  description:
    "Merge confirmed trip details into the session trip brief. Call after the traveler confirms fields. Dates must be YYYY-MM-DD. IATA codes are 3 letters.",
  inputSchema: tripStateSchema.partial(),
  async execute(patch) {
    tripSession.update((current) => {
      const merged = tripStateSchema.parse({
        ...current.trip,
        ...patch,
        modes: patch.modes ?? current.trip.modes,
      });
      const missing = missingTripFields(merged);
      merged.status = missing.length === 0 ? "planned" : "intake";
      return { ...current, trip: merged };
    });
    const next = tripSession.get();
    return {
      trip: next.trip,
      missing: missingTripFields(next.trip),
    };
  },
});
