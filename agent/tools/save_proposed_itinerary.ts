import { defineTool } from "eve/tools";
import { itinerarySchema } from "../../lib/trip";
import { tripSession } from "../lib/session-store";

export default defineTool({
  description:
    "Store the structured itinerary returned by the itinerary specialist so the UI canvas can render it.",
  inputSchema: itinerarySchema,
  async execute(itinerary) {
    tripSession.update((current) => ({
      ...current,
      itinerary,
      trip: { ...current.trip, status: "planned" },
    }));
    return itinerary;
  },
});
