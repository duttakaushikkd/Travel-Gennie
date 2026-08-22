import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { fareQuotes, itineraries, trips } from "@/lib/db/schema";
import type { FareComparison, Itinerary, TripState } from "@/lib/trip";

export async function saveTripForUser(input: {
  clerkUserId: string;
  tripId?: string;
  tripState: TripState;
  title?: string;
  itinerary?: Itinerary;
  comparison?: FareComparison;
}) {
  const db = getDb();
  const title =
    input.title ??
    `${input.tripState.originCity ?? "Trip"} → ${input.tripState.destinationCity ?? "destination"}`;

  let tripId = input.tripId;
  if (tripId) {
    const existing = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
    const row = existing[0];
    if (!row || row.clerkUserId !== input.clerkUserId) {
      throw new Error("Trip not found.");
    }
    await db
      .update(trips)
      .set({
        title,
        status: input.tripState.status,
        tripState: input.tripState,
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId));
  } else {
    const inserted = await db
      .insert(trips)
      .values({
        clerkUserId: input.clerkUserId,
        title,
        status: input.tripState.status,
        tripState: input.tripState,
      })
      .returning({ id: trips.id });
    tripId = inserted[0]?.id;
    if (!tripId) {
      throw new Error("Failed to save trip.");
    }
  }

  if (input.itinerary) {
    const versions = await db
      .select({ version: itineraries.version })
      .from(itineraries)
      .where(eq(itineraries.tripId, tripId))
      .orderBy(desc(itineraries.version))
      .limit(1);
    const nextVersion = (versions[0]?.version ?? 0) + 1;
    await db.insert(itineraries).values({
      tripId,
      version: nextVersion,
      days: input.itinerary,
    });
  }

  if (input.comparison) {
    const cheapest = input.comparison.options.find((option) => option.amount != null);
    await db.insert(fareQuotes).values({
      tripId,
      provider: cheapest?.source ?? "deep_link_only",
      amount: cheapest?.amount != null ? Math.round(cheapest.amount) : null,
      currency: cheapest?.currency ?? "INR",
      comparison: input.comparison,
    });
  }

  return { tripId, title };
}

export async function listTripsForUser(clerkUserId: string) {
  const db = getDb();
  return db
    .select({
      id: trips.id,
      title: trips.title,
      status: trips.status,
      tripState: trips.tripState,
      updatedAt: trips.updatedAt,
    })
    .from(trips)
    .where(eq(trips.clerkUserId, clerkUserId))
    .orderBy(desc(trips.updatedAt));
}

export async function loadTripForUser(clerkUserId: string, tripId: string) {
  const db = getDb();
  const rows = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  const trip = rows[0];
  if (!trip || trip.clerkUserId !== clerkUserId) {
    throw new Error("Trip not found.");
  }

  const itineraryRows = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.tripId, tripId))
    .orderBy(desc(itineraries.version))
    .limit(1);

  const quoteRows = await db
    .select()
    .from(fareQuotes)
    .where(eq(fareQuotes.tripId, tripId))
    .orderBy(desc(fareQuotes.fetchedAt))
    .limit(1);

  return {
    trip,
    itinerary: itineraryRows[0]?.days ?? null,
    comparison: quoteRows[0]?.comparison ?? null,
  };
}
