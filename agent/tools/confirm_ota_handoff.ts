import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { PRICE_DISCLAIMER } from "../../lib/ota-links";
import { otaPlatformSchema } from "../../lib/trip";
import { tripSession } from "../lib/session-store";

export default defineTool({
  description:
    "Ask the traveler to approve opening a third-party OTA in a new tab. Required before sending them off-site to book.",
  inputSchema: z.object({
    platform: otaPlatformSchema,
    optionId: z.string(),
  }),
  approval: always(),
  async execute({ platform, optionId }) {
    const { comparison, trip } = tripSession.get();
    const option = comparison?.options.find((item) => item.id === optionId);
    const link = option?.deepLinks.find((item) => item.platform === platform);
    if (!link) {
      throw new Error("That route or platform is not in the latest comparison. Search fares again.");
    }

    tripSession.update((current) => ({
      ...current,
      trip: { ...current.trip, status: "ready" },
    }));

    return {
      opensThirdParty: true,
      platform: link.label,
      url: link.url,
      route: `${trip.originIata} → ${trip.destinationIata}`,
      travelDate: trip.startDate,
      passengers: (trip.adults ?? 1) + (trip.children ?? 0) + (trip.infants ?? 0),
      quotedAmount: option?.amount ?? null,
      currency: option?.currency ?? "INR",
      quotedAt: comparison?.quotedAt,
      disclaimer: PRICE_DISCLAIMER,
    };
  },
});
