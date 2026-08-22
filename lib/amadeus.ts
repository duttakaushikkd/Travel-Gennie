import { getRedis } from "./redis";
import { buildOtaDeepLinks, PRICE_DISCLAIMER } from "./ota-links";
import type { FareComparison, FareOption, TripState } from "./trip";

type AmadeusToken = { access_token: string; expires_in: number };

type AmadeusOffer = {
  id: string;
  itineraries?: Array<{
    duration?: string;
    segments?: Array<{
      departure?: { iataCode?: string; at?: string };
      arrival?: { iataCode?: string; at?: string };
      carrierCode?: string;
    }>;
  }>;
  price?: { grandTotal?: string; currency?: string };
  validatingAirlineCodes?: string[];
};

function amadeusBaseUrl(): string {
  return process.env.AMADEUS_HOSTNAME === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";
}

async function getAmadeusToken(): Promise<string | null> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  const redis = getRedis();
  const cacheKey = "amadeus:token";
  const cached = redis ? await redis.get<string>(cacheKey) : null;
  if (cached) {
    return cached;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(`${amadeusBaseUrl()}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("Amadeus authentication failed. Check AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.");
  }

  const json = (await response.json()) as AmadeusToken;
  if (redis) {
    await redis.set(cacheKey, json.access_token, { ex: Math.max(60, json.expires_in - 60) });
  }
  return json.access_token;
}

function parseIsoDurationMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

function quoteCacheKey(trip: TripState): string {
  return [
    "fares",
    trip.originIata,
    trip.destinationIata,
    trip.startDate,
    trip.adults,
    trip.children,
    trip.infants,
  ].join(":");
}

export async function searchAndRankFares(trip: TripState): Promise<FareComparison> {
  const redis = getRedis();
  const cacheKey = quoteCacheKey(trip);
  if (redis) {
    const cached = await redis.get<FareComparison>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const deepLinks = buildOtaDeepLinks(trip);
  const token = await getAmadeusToken();
  let options: FareOption[] = [];

  if (token && trip.originIata && trip.destinationIata && trip.startDate) {
    const params = new URLSearchParams({
      originLocationCode: trip.originIata,
      destinationLocationCode: trip.destinationIata,
      departureDate: trip.startDate,
      adults: String(trip.adults ?? 1),
      children: String(trip.children ?? 0),
      infants: String(trip.infants ?? 0),
      currencyCode: "INR",
      max: "8",
    });

    const response = await fetch(
      `${amadeusBaseUrl()}/v2/shopping/flight-offers?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.ok) {
      const payload = (await response.json()) as { data?: AmadeusOffer[] };
      options = (payload.data ?? []).map((offer) => {
        const itinerary = offer.itineraries?.[0];
        const segments = itinerary?.segments ?? [];
        const first = segments[0];
        const last = segments.at(-1);
        return {
          id: offer.id,
          originIata: first?.departure?.iataCode ?? trip.originIata ?? "",
          destinationIata: last?.arrival?.iataCode ?? trip.destinationIata ?? "",
          departureAt: first?.departure?.at ?? "",
          arrivalAt: last?.arrival?.at ?? "",
          durationMinutes: parseIsoDurationMinutes(itinerary?.duration),
          stops: Math.max(0, segments.length - 1),
          carrier: offer.validatingAirlineCodes?.[0] ?? first?.carrierCode ?? "Unknown",
          amount: offer.price?.grandTotal ? Number(offer.price.grandTotal) : null,
          currency: offer.price?.currency ?? "INR",
          source: "amadeus" as const,
          deepLinks,
        };
      });
    }
  }

  if (options.length === 0 && deepLinks.length > 0) {
    options = [
      {
        id: "deep-link-only",
        originIata: trip.originIata ?? "",
        destinationIata: trip.destinationIata ?? "",
        departureAt: trip.startDate ?? "",
        arrivalAt: trip.endDate ?? "",
        durationMinutes: 0,
        stops: 0,
        carrier: "Compare on OTAs",
        amount: null,
        currency: "INR",
        source: "deep_link_only",
        deepLinks,
      },
    ];
  }

  options.sort((a, b) => {
    if (a.amount == null && b.amount == null) return a.durationMinutes - b.durationMinutes;
    if (a.amount == null) return 1;
    if (b.amount == null) return -1;
    if (a.amount !== b.amount) return a.amount - b.amount;
    if (a.stops !== b.stops) return a.stops - b.stops;
    return a.durationMinutes - b.durationMinutes;
  });

  const cheapestWithPrice = options.find((option) => option.amount != null);
  const comparison: FareComparison = {
    quotedAt: new Date().toISOString(),
    disclaimer: PRICE_DISCLAIMER,
    cheapestPlatform: cheapestWithPrice
      ? "Compare live OTA prices on MakeMyTrip, Goibibo, and EaseMyTrip — licensed search is a snapshot, not a storefront."
      : "No live fare snapshot. Open each OTA to compare current prices.",
    options,
  };

  if (redis) {
    await redis.set(cacheKey, comparison, { ex: 20 * 60 });
  }

  return comparison;
}
