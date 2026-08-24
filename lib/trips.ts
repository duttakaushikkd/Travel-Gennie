import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/mongo";
import type { FareComparison, Itinerary, TripState } from "@/lib/trip";

type TripDocument = {
  _id: string;
  comparison?: FareComparison;
  createdAt: Date;
  itinerary?: Itinerary;
  status: string;
  title: string;
  tripState: TripState;
  updatedAt: Date;
  userId: string;
};

export async function saveTripForUser(input: {
  comparison?: FareComparison;
  itinerary?: Itinerary;
  title?: string;
  tripId?: string;
  tripState: TripState;
  userId: string;
}) {
  const db = await getDb();
  const title =
    input.title ??
    `${input.tripState.originCity ?? "Trip"} → ${input.tripState.destinationCity ?? "destination"}`;
  const now = new Date();
  let tripId = input.tripId;

  if (tripId) {
    const existing = await db.collection<TripDocument>("trips").findOne({ _id: tripId });
    if (!existing || existing.userId !== input.userId) {
      throw new Error("Trip not found.");
    }
    await db.collection<TripDocument>("trips").updateOne(
      { _id: tripId },
      {
        $set: {
          comparison: input.comparison ?? existing.comparison,
          itinerary: input.itinerary ?? existing.itinerary,
          status: input.tripState.status,
          title,
          tripState: input.tripState,
          updatedAt: now,
        },
      },
    );
  } else {
    tripId = randomUUID();
    await db.collection<TripDocument>("trips").insertOne({
      _id: tripId,
      comparison: input.comparison,
      createdAt: now,
      itinerary: input.itinerary,
      status: input.tripState.status,
      title,
      tripState: input.tripState,
      updatedAt: now,
      userId: input.userId,
    });
  }

  return { title, tripId };
}

export async function listTripsForUser(userId: string) {
  const db = await getDb();
  const rows = await db
    .collection<TripDocument>("trips")
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();

  return rows.map((row) => ({
    id: row._id,
    status: row.status,
    title: row.title,
    tripState: row.tripState,
    updatedAt: row.updatedAt,
  }));
}

export async function loadTripForUser(userId: string, tripId: string) {
  const db = await getDb();
  const trip = await db.collection<TripDocument>("trips").findOne({ _id: tripId });
  if (!trip || trip.userId !== userId) {
    throw new Error("Trip not found.");
  }

  return {
    comparison: trip.comparison ?? null,
    itinerary: trip.itinerary ?? null,
    trip: {
      id: trip._id,
      title: trip.title,
      tripState: trip.tripState,
    },
  };
}
