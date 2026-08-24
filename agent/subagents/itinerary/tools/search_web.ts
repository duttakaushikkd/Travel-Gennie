import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchTravelWeb } from "../../../../lib/wiki";
import { enforceRateLimit } from "../../../../lib/rate-limit";
import { rateLimitKey } from "../../../lib/auth";

export default defineTool({
  description:
    "Search Wikivoyage and Wikipedia for attractions, neighborhoods, and practical travel notes.",
  inputSchema: z.object({
    query: z.string().min(4),
  }),
  async execute({ query }, ctx) {
    await enforceRateLimit(rateLimitKey(ctx), "wiki");
    return searchTravelWeb(query);
  },
});
