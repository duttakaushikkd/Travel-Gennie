import type { EveMessage, EveMessagePart } from "eve/react";
import {
  fareComparisonSchema,
  itinerarySchema,
  type FareComparison,
  type Itinerary,
} from "@/lib/trip";

function toolName(part: EveMessagePart): string | undefined {
  return part.type === "dynamic-tool" ? part.toolName : undefined;
}

function toolOutput(part: EveMessagePart): unknown {
  return part.type === "dynamic-tool" ? part.output : undefined;
}

export function extractTripArtifacts(messages: readonly EveMessage[]): {
  itinerary?: Itinerary;
  comparison?: FareComparison;
  handoff?: {
    url: string;
    platform: string;
    disclaimer: string;
    quotedAmount: number | null;
    currency: string;
    route: string;
    travelDate?: string;
  };
} {
  let itinerary: Itinerary | undefined;
  let comparison: FareComparison | undefined;
  let handoff: ReturnType<typeof extractTripArtifacts>["handoff"];

  for (const message of messages) {
    for (const part of message.parts) {
      const name = toolName(part);
      const output = toolOutput(part);
      if (!name || output == null) continue;

      if (name === "save_proposed_itinerary" || name === "submit_itinerary" || name === "itinerary") {
        const candidate =
          typeof output === "object" && output && "days" in output
            ? output
            : typeof output === "object" && output && "output" in output
              ? (output as { output: unknown }).output
              : undefined;
        const parsed = itinerarySchema.safeParse(candidate);
        if (parsed.success) itinerary = parsed.data;
      }

      if (name === "search_and_rank_fares") {
        const parsed = fareComparisonSchema.safeParse(output);
        if (parsed.success) comparison = parsed.data;
      }

      if (name === "load_trip" && typeof output === "object" && output) {
        const record = output as { itinerary?: unknown; comparison?: unknown };
        const parsedItinerary = itinerarySchema.safeParse(record.itinerary);
        const parsedComparison = fareComparisonSchema.safeParse(record.comparison);
        if (parsedItinerary.success) itinerary = parsedItinerary.data;
        if (parsedComparison.success) comparison = parsedComparison.data;
      }

      if (name === "confirm_ota_handoff" && typeof output === "object" && output) {
        const record = output as Record<string, unknown>;
        if (typeof record.url === "string" && typeof record.platform === "string") {
          handoff = {
            url: record.url,
            platform: record.platform,
            disclaimer: String(record.disclaimer ?? ""),
            quotedAmount: typeof record.quotedAmount === "number" ? record.quotedAmount : null,
            currency: String(record.currency ?? "INR"),
            route: String(record.route ?? ""),
            travelDate: typeof record.travelDate === "string" ? record.travelDate : undefined,
          };
        }
      }
    }
  }

  return { itinerary, comparison, handoff };
}
