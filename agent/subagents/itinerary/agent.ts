import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Build a practical day-by-day itinerary for India-origin trips using web research. Returns structured days, places, and estimated costs.",
  model: openai("gpt-4.1"),
});
