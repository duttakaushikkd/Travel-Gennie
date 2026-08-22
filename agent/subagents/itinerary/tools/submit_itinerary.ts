import { defineTool } from "eve/tools";
import { itinerarySchema } from "../../../../lib/trip";

export default defineTool({
  description: "Return the final structured itinerary for the parent orchestrator.",
  inputSchema: itinerarySchema,
  async execute(itinerary) {
    return itinerary;
  },
});
